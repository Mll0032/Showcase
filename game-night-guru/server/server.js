const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'mll0032',
  password: '@Ilovematcha2',
  database: 'game_night_nexus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.post('/api/add-game', async (req, res) => {
  const { gameName } = req.body;
  try {
    // Search for the game on BGG
    const searchResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(gameName)}&type=boardgame`);
    const searchResult = await xml2js.parseStringPromise(searchResponse.data);
    
    if (searchResult.items.item && searchResult.items.item.length > 0) {
      const gameId = searchResult.items.item[0].$.id;
      
      // Get detailed game info
      const gameResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}`);
      const gameResult = await xml2js.parseStringPromise(gameResponse.data);
      
      const game = gameResult.items.item[0];
      const newGame = {
        bgg_id: gameId,
        name: game.name[0].$.value,
        image_url: game.image[0],
        min_players: game.minplayers[0].$.value,
        max_players: game.maxplayers[0].$.value,
        playing_time: game.playingtime[0].$.value,
        description: game.description[0],
      };
      
      // Insert game into MySQL database
      const connection = await pool.getConnection();
      try {
        await connection.query(
          'INSERT INTO games (bgg_id, name, image_url, min_players, max_players, playing_time, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newGame.bgg_id, newGame.name, newGame.image_url, newGame.min_players, newGame.max_players, newGame.playing_time, newGame.description]
        );
        res.json(newGame);
      } finally {
        connection.release();
      }
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching or storing game data' });
  }
});

app.get('/api/games', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query('SELECT * FROM games');
        res.json(rows);
      } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Error executing database query' });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ error: 'Error connecting to database' });
    }
  });

  // Add this new route to your server.js
app.delete('/api/games/:id', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      try {
        const [result] = await connection.query('DELETE FROM games WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Game not found' });
        } else {
          res.json({ message: 'Game removed successfully' });
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error removing game:', error);
      res.status(500).json({ error: 'Error removing game from database' });
    }
  });
  
  // Modify the existing search route to return more details for the dropdown
  app.get('/api/search-games', async (req, res) => {
  const { query } = req.query;
  try {
    // Search for games
    const searchResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`);
    const searchResult = await xml2js.parseStringPromise(searchResponse.data);
    
    if (searchResult.items.item) {
      // Get the first 5 games
      const gameIds = searchResult.items.item.slice(0, 5).map(game => game.$.id);
      
      // Fetch detailed info for these games
      const detailsResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${gameIds.join(',')}`);
      const detailsResult = await xml2js.parseStringPromise(detailsResponse.data);
      
      const games = detailsResult.items.item.map(game => {
        const nameTag = game.name.find(name => name.$.type === 'primary');
        return {
          id: game.$.id,
          name: nameTag ? nameTag.$.value : 'Unknown',
          yearPublished: game.yearpublished ? game.yearpublished[0].$.value : 'N/A',
          image_url: game.image ? game.image[0] : null,
          thumbnail_url: game.thumbnail ? game.thumbnail[0] : null
        };
      });
      
      console.log('Processed games:', games); // Log the processed games
      res.json(games);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({ error: 'Error searching games' });
  }
});

const MAX_IMPORT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_PAGES = 100;

app.post('/api/import-bgg-library', async (req, res) => {
  const importStartTime = Date.now();
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'BGG username is required' });
  }

  // Set up SSE for progress reporting
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = (message) => {
    res.write(`data: ${JSON.stringify({ message })}\n\n`);
  };

  try {
    let allGameIds = new Set();
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages && page <= MAX_PAGES) {
      if (Date.now() - importStartTime > MAX_IMPORT_TIME) {
        throw new Error('Import process timed out');
      }

      sendProgress(`Fetching collection page ${page}`);
      const collectionResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/collection?username=${username}&own=1&page=${page}`);
      
      if (collectionResponse.status === 202) {
        sendProgress('BGG is processing the request. Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      const collectionResult = await xml2js.parseStringPromise(collectionResponse.data);
      
      if (!collectionResult.items || !collectionResult.items.item || collectionResult.items.item.length === 0) {
        hasMorePages = false;
      } else {
        const pageGameIds = collectionResult.items.item.map(item => item.$.objectid);
        const newIds = pageGameIds.filter(id => !allGameIds.has(id));
        if (newIds.length === 0) {
          // If we didn't add any new IDs, we've reached the end of the collection
          hasMorePages = false;
        } else {
          newIds.forEach(id => allGameIds.add(id));
          page++;
        }
      }
    }

    const gameIdsArray = Array.from(allGameIds);
    sendProgress(`Found ${gameIdsArray.length} games in the collection`);

    if (gameIdsArray.length === 0) {
      sendProgress('No games found in the user\'s BGG library');
      return res.end();
    }

    // Fetch detailed info for these games in batches of 20
    const batchSize = 20;
    let allGames = [];

    for (let i = 0; i < gameIdsArray.length; i += batchSize) {
      if (Date.now() - importStartTime > MAX_IMPORT_TIME) {
        throw new Error('Import process timed out');
      }

      const batchIds = gameIdsArray.slice(i, i + batchSize);
      sendProgress(`Fetching details for games ${i + 1} to ${Math.min(i + batchSize, gameIdsArray.length)}`);
      const detailsResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${batchIds.join(',')}`);
      const detailsResult = await xml2js.parseStringPromise(detailsResponse.data);

      const batchGames = detailsResult.items.item.map(game => {
        const nameTag = game.name.find(name => name.$.type === 'primary');
        return {
          bgg_id: game.$.id,
          name: nameTag ? nameTag.$.value : 'Unknown',
          image_url: game.image ? game.image[0] : null,
          min_players: game.minplayers ? game.minplayers[0].$.value : null,
          max_players: game.maxplayers ? game.maxplayers[0].$.value : null,
          playing_time: game.playingtime ? game.playingtime[0].$.value : null,
          description: game.description ? game.description[0] : null,
        };
      });

      allGames = allGames.concat(batchGames);
    }

    sendProgress(`Processed ${allGames.length} games`);

    // Insert games into the database
    const connection = await pool.getConnection();
    try {
      sendProgress('Starting database insertion');
      for (const game of allGames) {
        if (Date.now() - importStartTime > MAX_IMPORT_TIME) {
          throw new Error('Import process timed out');
        }

        await connection.query(
          'INSERT INTO games (bgg_id, name, image_url, min_players, max_players, playing_time, description) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image_url=VALUES(image_url), min_players=VALUES(min_players), max_players=VALUES(max_players), playing_time=VALUES(playing_time), description=VALUES(description)',
          [game.bgg_id, game.name, game.image_url, game.min_players, game.max_players, game.playing_time, game.description]
        );
      }
      sendProgress('Database insertion completed');
      sendProgress(`Successfully imported ${allGames.length} games from BGG library`);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in import process:', error);
    sendProgress(`Error: ${error.message}`);
  }

  res.end();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));