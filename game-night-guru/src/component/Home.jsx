//Home Page
import React from 'react';
import GameSuggestionCard from './GameSuggestionCard';

const Home = () => {
  return (
    <div className="hero-section">
    <div className="home">
      <div>
      <h2 className='home-border'>Welcome to Game Night Nexus</h2>
      <p className='home-p'>Your ultimate portal for organizing board game adventures</p>
      </div>
      <GameSuggestionCard />
    </div>
    </div>
  );
};

export default Home;