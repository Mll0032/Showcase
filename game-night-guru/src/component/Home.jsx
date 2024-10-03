//Home Page
import React from 'react';
import GameSuggestionCard from './GameSuggestionCard';

const Home = () => {
  return (
    <div className="hero-section">
    <div className="home">
      <div>
      <h2 className='home-border'>Welcome to Game Night Nexus</h2>
      </div>
      <GameSuggestionCard />
    </div>
    </div>
  );
};

export default Home;