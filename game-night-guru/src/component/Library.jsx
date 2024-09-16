//Library page
import React from 'react';
import gameLibrary from './gamelibrary';

const Library = () => {
  return (
    <div className="game-library">
      <h2 className="library-title">Game Library</h2>
      <div className="game-grid">
        {gameLibrary.map((game) => (
          <div key={game.title} className="game-card">
            <img src={game.image} alt={game.title} className="game-image" />
            <h3 className="game-title">{game.title}</h3>
            <p className="game-info">Players: {game.minNumOfPlayer} - {game.maxNumOfPlayer}</p>
            <p className="game-info">Times Played: {game.userPlays}</p>
            <p className="game-info">Last Played: {game.datesPlayed[game.datesPlayed.length - 1]}</p>
            <a href={game.bgglink} target="_blank" rel="noopener noreferrer" className="bgg-link">
              View on BoardGameGeek
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;