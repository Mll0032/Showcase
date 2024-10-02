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
      const searchResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`);
      const searchResult = await xml2js.parseStringPromise(searchResponse.data);
      
      if (searchResult.items.item) {
        const games = searchResult.items.item.map(game => ({
          id: game.$.id,
          name: game.name[0].$.value,
          yearPublished: game.yearpublished ? game.yearpublished[0].$.value : 'N/A'
        })).slice(0, 5); // Limit to 5 results for the dropdown
        
        res.json(games);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error searching games:', error);
      res.status(500).json({ error: 'Error searching games' });
    }
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));