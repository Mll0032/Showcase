const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174'], // Updated to match Vite's default port
  credentials: true,
}));

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'game_night_nexus',
  password: 'game_night_nexus',
  database: 'game_night_nexus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden. Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};



// Route to add a game to the user's library
app.post('/api/add-game', authenticateJWT, async (req, res) => {
  const { gameName } = req.body;
  console.log('Received gameName:', gameName);

  if (!gameName) {
    return res.status(400).json({ error: 'Game name is required' });
  }

  try {
    // Search for the game to get its ID
    const searchResponse = await axios.get(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(gameName)}&type=boardgame`
    );
    const searchResult = await xml2js.parseStringPromise(searchResponse.data);

    if (searchResult.items.item && searchResult.items.item.length > 0) {
      // Assume the first result is the desired game
      const gameId = searchResult.items.item[0].$.id;

      // Fetch game details
      const gameResponse = await axios.get(
        `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`
      );
      const gameData = await xml2js.parseStringPromise(gameResponse.data);
      const gameItem = gameData.items.item[0];

      const gameDetails = {
        user_id: req.user.userId,
        bgg_id: gameId,
        name: gameItem.name[0].$.value,
        year_published: gameItem.yearpublished ? gameItem.yearpublished[0].$.value : 'N/A',
        min_players: gameItem.minplayers ? gameItem.minplayers[0].$.value : null,
        max_players: gameItem.maxplayers ? gameItem.maxplayers[0].$.value : null,
        playing_time: gameItem.playingtime ? gameItem.playingtime[0].$.value : null,
        image_url: gameItem.image ? gameItem.image[0] : null,
      };

      // Save the game to your database
      const connection = await pool.getConnection();
      try {
        await connection.query('INSERT INTO user_games SET ?', gameDetails);
        res.json({ message: 'Game added successfully', game: gameDetails });
      } finally {
        connection.release();
      }
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Error adding game', details: error.message });
  }
});

// Route to search for games
app.get('/api/search-games', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const searchResponse = await axios.get(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    );
    const searchResult = await xml2js.parseStringPromise(searchResponse.data);

    if (searchResult.items.item && searchResult.items.item.length > 0) {
      const games = searchResult.items.item.map((item) => ({
        id: item.$.id,
        name: item.name[0].$.value,
        yearPublished: item.yearpublished ? item.yearpublished[0].$.value : 'N/A',
      }));
      res.json(games);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Error fetching search results' });
  }
});

// Route to get all games for the logged-in user
app.get('/api/user_games', authenticateJWT, async (req, res) => {
  const userId = req.user.userId; // from the JWT
  try {
    const connection = await pool.getConnection();
    try {
      // Fetch from user_games where user_id = this user's ID
      const [rows] = await connection.query(
        'SELECT * FROM user_games WHERE user_id = ?',
        [userId]
      );
      res.json(rows); // return the array of games
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Error connecting to database' });
  }
});

// Route to delete a game from the user's library
app.delete('/api/user_games/:id', authenticateJWT, async (req, res) => {
  const userId = req.user.userId; // from JWT
  const gameId = req.params.id;   // from route param
  try {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM user_games WHERE id = ? AND user_id = ?',
        [gameId, userId]
      );
      if (result.affectedRows === 0) {
        res
          .status(404)
          .json({ error: 'Game not found or not authorized to delete' });
      } else {
        res.json({ message: 'Game removed successfully' });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error removing game:', error);
    res
      .status(500)
      .json({ error: 'Error removing game from database', details: error.message });
  }
});

// Route to import BGG library
app.post('/api/import-bgg-library', authenticateJWT, async (req, res) => {
  const importStartTime = Date.now();
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'BGG username is required' });
  }

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

    while (hasMorePages && page <= 100) {
      if (Date.now() - importStartTime > 10 * 60 * 1000) {
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
        pageGameIds.forEach(id => allGameIds.add(id));
        page++;
      }
    }

    const gameIdsArray = Array.from(allGameIds);
    sendProgress(`Found ${gameIdsArray.length} games in the collection`);

    if (gameIdsArray.length === 0) {
      sendProgress("No games found in the user's BGG library");
      return res.end();
    }

    const batchSize = 20;
    let allGames = [];

    for (let i = 0; i < gameIdsArray.length; i += batchSize) {
      if (Date.now() - importStartTime > 10 * 60 * 1000) {
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

    const connection = await pool.getConnection();
    try {
      sendProgress('Starting database insertion');
      for (const game of allGames) {
        if (Date.now() - importStartTime > 10 * 60 * 1000) {
          throw new Error('Import process timed out');
        }

        await connection.query(
          'INSERT INTO user_games (user_id, bgg_id, name, image_url, min_players, max_players, playing_time, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image_url=VALUES(image_url), min_players=VALUES(min_players), max_players=VALUES(max_players), playing_time=VALUES(playing_time), description=VALUES(description)',
          [req.user.userId, game.bgg_id, game.name, game.image_url, game.min_players, game.max_players, game.playing_time, game.description]
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

// Route to clear the user's library
app.delete('/api/clear-library', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  try {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM user_games WHERE user_id = ?', [userId]);
      res.json({ message: 'Library cleared successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error clearing library:', error);
    res.status(500).json({ error: 'Error clearing library', details: error.message });
  }
});

// User signup route
app.post('/api/signup', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// User login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user[0].id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));