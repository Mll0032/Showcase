import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameLibrary = () => {
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/games');
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const addGame = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/add-game', { gameName: newGameName });
      setNewGameName('');
      fetchGames();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  const removeGame = async (gameId) => {
    try {
      await axios.delete(`http://localhost:3001/api/games/${gameId}`);
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
    } catch (error) {
      console.error('Error removing game:', error);
    }
  };

  return (
    <div className="game-library">
      <h2 className="library-title">Game Library</h2>
      
      <form onSubmit={addGame} className="add-game-form">
        <input
          type="text"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
          placeholder="Enter game name"
          required
        />
        <button type="submit">Add Game</button>
      </form>

      <div className="game-grid">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <img src={game.image_url} alt={game.name} className="game-image" />
            <h3 className="game-title">{game.name}</h3>
            <p className="game-info">Players: {game.min_players} - {game.max_players}</p>
            <p className="game-info">Playing Time: {game.playing_time} minutes</p>
            <a href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`} target="_blank" rel="noopener noreferrer" className="bgg-link">
              View on BoardGameGeek
            </a>
            <button onClick={() => removeGame(game.id)} className="remove-game">Remove Game</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLibrary;