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
  const userId = req.user.userId;
  try {
    const searchResponse = await axios.get(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(gameName)}&type=boardgame`);
    const searchResult = await xml2js.parseStringPromise(searchResponse.data);
    
    if (searchResult.items.item && searchResult.items.item.length > 0) {
      const gameId = searchResult.items.item[0].$.id;
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

      const connection = await pool.getConnection();
      try {
        await connection.query(
          'INSERT INTO games (user_id, bgg_id, name, image_url, min_players, max_players, playing_time, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, newGame.bgg_id, newGame.name, newGame.image_url, newGame.min_players, newGame.max_players, newGame.playing_time, newGame.description]
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

// Route to get all games for the logged-in user
app.get('/api/games', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM games WHERE user_id = ?', [userId]);
      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Error connecting to database' });
  }
});

// Route to delete a game from the user's library
app.delete('/api/games/:id', authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  const gameId = req.params.id;
  try {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query('DELETE FROM games WHERE id = ? AND user_id = ?', [gameId, userId]);
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Game not found or not authorized to delete' });
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
          'INSERT INTO games (user_id, bgg_id, name, image_url, min_players, max_players, playing_time, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image_url=VALUES(image_url), min_players=VALUES(min_players), max_players=VALUES(max_players), playing_time=VALUES(playing_time), description=VALUES(description)',
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
      await connection.query('DELETE FROM games WHERE user_id = ?', [userId]);
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