//Home Page
import React from 'react';
import GameSuggestionCard from './GameSuggestionCard';

const Home = () => {
  return (
    <div className="home">
      <div className="hero-section">
      <h2>Welcome to Game Night Nexus</h2>
      </div>
      <GameSuggestionCard />
    </div>
  );
};

export default Home;