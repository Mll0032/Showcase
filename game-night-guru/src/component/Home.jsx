//Home Page
import React from 'react';
import GameSuggestionCard from './GameSuggestionCard';

const Home = () => {
  return (
    <div className="home">
      <h2>Welcome to Game Night Nexus</h2>
      <GameSuggestionCard />
    </div>
  );
};

export default Home;