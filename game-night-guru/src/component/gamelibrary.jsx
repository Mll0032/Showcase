import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';

const GameLibrary = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/games');
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 1) {
      fetchSearchResults(e.target.value);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const fetchSearchResults = async (query) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/search-games?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleSuggestionClick = (game) => {
    setSearchQuery(game.name);
    setShowSuggestions(false);
    setSearchResults([]);
  };

  const addGame = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/add-game', { gameName: searchQuery });
      setSearchQuery('');
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
    <div className='hero-section'>
    <div className="game-library">
      <h2 className="library-title">Game Library</h2>
      
      <form onSubmit={addGame} className="add-game-form">
        <div ref={wrapperRef} className="autocomplete-wrapper">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter game name to add to library"
            required
            onFocus={() => setShowSuggestions(true)}
          />
          <FaSearch className="search-icon" />
          {showSuggestions && searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map(game => (
                <li key={game.id} onClick={() => handleSuggestionClick(game)}>
                  {game.name} ({game.yearPublished})
                </li>
              ))}
            </ul>
          )}
        </div>
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
    </div>
  );
};

export default GameLibrary;
