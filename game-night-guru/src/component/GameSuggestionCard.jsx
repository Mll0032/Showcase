import React, { useState } from 'react';
import gameLibrary from './gamelibrary';

const GameSuggestionCard = () => {
  const [players, setPlayers] = useState('');
  const [time, setTime] = useState('');
  const [suggestedGames, setSuggestedGames] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const availableGames = gameLibrary.filter(game => 
      game.minNumOfPlayer <= parseInt(players) &&
      game.maxNumOfPlayer >= parseInt(players)
      // We could add a time filter here if we had that information in our game library
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
              <li key={game.title}>{game.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSuggestionCard;