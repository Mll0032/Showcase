import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameSuggestionCard = () => {
  const [players, setPlayers] = useState(1);
  const [time, setTime] = useState(30);
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

  const handlePlayersChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPlayers(value ? Math.max(Number(value), 1) : '');
  };

  const handleTimeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setTime(value ? Math.max(Number(value), 30) : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numPlayers = Number(players);
    const numTime = Number(time);
    const availableGames = allGames.filter(game => 
      game.min_players <= numPlayers &&
      game.max_players >= numPlayers &&
      game.playing_time <= numTime
    );
    setSuggestedGames(availableGames);
  };

  return (
    <div className="game-suggestion-card">
      <h2 className="card-title">Let's Play!</h2>
      <form onSubmit={handleSubmit} className="game-form">
        <div className="form-group">
          <label htmlFor="players">How many players?</label>
          <div className="custom-number-input">
            <button type="button" onClick={() => setPlayers(prev => Math.max(Number(prev) - 1, 1))}>-</button>
            <input
              type="text"
              id="players"
              value={players}
              onChange={handlePlayersChange}
              required
            />
            <button type="button" onClick={() => setPlayers(prev => Number(prev) + 1)}>+</button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="time">How much time do you have?</label>
          <div className="custom-number-input">
            <button type="button" onClick={() => setTime(prev => Math.max(Number(prev) - 30, 30))}>-</button>
            <input
              type="text"
              id="time"
              value={time}
              onChange={handleTimeChange}
              required
            />
            <button type="button" onClick={() => setTime(prev => Number(prev) + 30)}>+</button>
          </div>
          <label htmlFor="time">(minutes)</label>
        </div>
        <button type="submit" className="submit-button">Find Games</button>
      </form>
     {suggestedGames.length > 0 && (
      <div className="suggested-games">
        <h3>Suggested Games:</h3>
        <div className="suggested-games-grid">
          {suggestedGames.map(game => (
            <div key={game.id} className="suggested-game-card">
              <img
                src={game.image_url}
                alt={`${game.name} cover`}
                className="suggested-game-image"
              />
              <h4 className="suggested-game-title">{game.name}</h4>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
};

export default GameSuggestionCard;
