import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameSuggestionCard = () => {
  const [players, setPlayers] = useState('');
  const [time, setTime] = useState('');
  const [suggestedGames, setSuggestedGames] = useState([]);
  const [allGames, setAllGames] = useState([]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/games');
      setAllGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const availableGames = allGames.filter(game => 
      game.min_players <= parseInt(players) &&
      game.max_players >= parseInt(players) &&
      game.playing_time <= parseInt(time)
    );
    setSuggestedGames(availableGames);
  };

  return (
    <div className="game-suggestion-card">
      <h2 className="card-title">Let's Play!</h2>
      <form onSubmit={handleSubmit} className="game-form">
        <div className="form-group">
          <label htmlFor="players">How many players?</label>
          <input 
            type="number" 
            id="players" 
            value={players} 
            onChange={(e) => setPlayers(e.target.value)}
            min="1"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="time">How much time do you have? (minutes)</label>
          <input 
            type="number" 
            id="time" 
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            min="1"
            required
          />
        </div>
        <button type="submit" className="submit-button">Find Games</button>
      </form>
      {suggestedGames.length > 0 && (
        <div className="suggested-games">
          <h3>Suggested Games:</h3>
          <ul>
            {suggestedGames.map(game => (
              <li key={game.id}>{game.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSuggestionCard;