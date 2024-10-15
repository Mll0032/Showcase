//localhost:3001/api/games

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSearch, FaFileImport, FaTrash } from 'react-icons/fa';
import api from './api';

const GameLibrary = () => {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bggUsername, setBggUsername] = useState(''); // Add this line
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:3001/api/games', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGames(response.data);
        } else {
          console.error('No token found, cannot fetch games');
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };
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

  useEffect(() => {
    const fetchLibrary = async () => {
      const token = localStorage.getItem('token');
      console.log('Retrieved token:', token);
      if (token) {
        const response = await axios.get('/api/games', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGames(response.data);
      }
    };
    fetchLibrary();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Retrieved token:', token);
      if (!token) {
        throw new Error('No token found, please log in');
      }
      
      const response = await axios.get('http://localhost:3001/api/games', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGames(response.data);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        alert('Session expired, please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.error('Error fetching games:', error);
      }
    }
  };

  const fetchSearchResults = async (query) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/search-games?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error', error.message);
      }
      setSearchResults([]);
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
      const response = await axios.post('http://localhost:3001/api/add-game', { gameName: searchQuery });
      setSearchQuery('');
      // Update the games state with the new game added
      setGames(prevGames => {
        const updatedGames = [...prevGames, response.data];
        // Sort the updated games array
        fetchGames();
        return updatedGames.sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  const removeGame = async (gameId) => {
    try {
      await axios.delete(`http://localhost:3001/api/games/${gameId}`);
      setGames(prevGames => {
        const updatedGames = prevGames.filter(game => game.id !== gameId);
        // Sort the updated games array
        return updatedGames.sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (error) {
      console.error('Error removing game:', error);
    }
  };

  const LazyImage = ({ src, thumbnail, alt, className }) => {
    const [imageSrc, setImageSrc] = useState('/placeholder-image.jpg');
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef(null);
  
    useEffect(() => {
      console.log("LazyImage src:", src, "thumbnail:", thumbnail); // Debugging log
      if (!src && !thumbnail) {
        setImageLoaded(true);
        return;
      }
  
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            const img = new Image();
            img.src = thumbnail || src; // Try thumbnail first, fall back to full image
            img.onload = () => {
              setImageSrc(img.src);
              setImageLoaded(true);
            };
            img.onerror = () => {
              console.error("Failed to load image:", img.src); // Error log
              if (img.src === thumbnail && src) {
                // If thumbnail failed and we have a full image URL, try that
                img.src = src;
              } else {
                setImageLoaded(true);
              }
            };
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
  
      if (imageRef.current) {
        observer.observe(imageRef.current);
      }
  
      return () => {
        if (imageRef.current) {
          observer.unobserve(imageRef.current);
        }
      };
    }, [src, thumbnail]);
  
    if (!src && !thumbnail) {
      return <div className={`${className} placeholder`}>No Image</div>;
    }
  
    return (
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${imageLoaded ? 'loaded' : 'loading'}`}
        loading="lazy"
      />
    );
  };

  const handleBggUsernameChange = (e) => {
    setBggUsername(e.target.value);
  };

  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const importBggLibrary = async (e) => {
    e.preventDefault();
    setIsImporting(true);
    setImportProgress('Starting import...');
    setError(null);
  
    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
  
      const response = await fetch('http://localhost:3001/api/import-bgg-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the authorization token here
        },
        body: JSON.stringify({ username: bggUsername }),
      });
  
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const decodedChunk = decoder.decode(value, { stream: true });
        const lines = decodedChunk.split('\n\n');
  
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setImportProgress(data.message);
              console.log('Progress update:', data.message); // Debugging log
            } catch (error) {
              console.error('Error parsing progress data:', error);
            }
          }
        }
      }
  
      setIsImporting(false);
      fetchGames(); // Refresh the game list after import
    } catch (error) {
      console.error('Error importing BGG library:', error);
      setImportProgress('Import failed');
      setIsImporting(false);
      setError(`Error: ${error.message}`);
    }
  };
  

  const handleClearLibrary = async () => {
    setShowConfirmDialog(true);
  };

  const confirmClearLibrary = async () => {
    try {
      await axios.delete('http://localhost:3001/api/clear-library');
      setShowConfirmDialog(false);
      fetchGames(); // Refresh the game list after clearing
      setImportProgress('Library cleared successfully');
    } catch (error) {
      console.error('Error clearing library:', error);
      setError(`Error clearing library: ${error.message}`);
    }
  };

  const cancelClearLibrary = () => {
    setShowConfirmDialog(false);
  };
  
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className='hero-section'>
    <div className="game-library">
      <h2 className="library-title">Game Library</h2>
      
      <form onSubmit={addGame} className="add-game-form">
        <div className='auto-complete1'>
        <div ref={wrapperRef} className="autocomplete-wrapper">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter game name"
            required
            onFocus={() => setShowSuggestions(true)}
          />
          <FaSearch className="search-icon" />
          
          {showSuggestions && searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map(game => (
                <li key={game.id} onClick={() => handleSuggestionClick(game)}>
                  {game.image_url ? (
                      <LazyImage 
                        src={game.image_url} 
                        alt={`${game.name} cover`} 
                        className="search-result-image"
                      />
                    ) : (
                      <div className="search-result-image placeholder"></div>
                    )}
                    <span>{game.name} ({game.yearPublished})</span>             
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
        <button type="submit">Add Game</button>
      </form>
      
      <div>
        <h1>-or-</h1>
      </div>
      <form onSubmit={importBggLibrary} className="import-bgg-form">
          <input
            type="text"
            value={bggUsername}
            onChange={(e) => setBggUsername(e.target.value)}
            placeholder="Enter BGG Username"
            required
            disabled={isImporting}
          />
          <button type="submit" disabled={isImporting}>
            <FaFileImport /> {isImporting ? 'Importing...' : 'Import BGG Library'}
          </button>
        </form>

        {importProgress && <p className="import-progress">{importProgress}</p>}
        {error && <p className="error-message">{error}</p>}

        
      <div className="game-grid">
        {games.map((game) => (
          <div key={game.id || game.bgg_id} className="game-card">
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
    <button onClick={handleClearLibrary} className="clear-library-button">
          <FaTrash /> Clear Library
        </button>

        {showConfirmDialog && (
          <div className="confirm-dialog">
            <p>Are you sure you want to clear your entire library? This action cannot be undone.</p>
            <button onClick={confirmClearLibrary}>Yes, Clear Library</button>
            <button onClick={cancelClearLibrary}>Cancel</button>
          </div>
        )}
    </div>
  );
};

export default GameLibrary;



//TODO: Add a 5 star rating system to the games in your library

//TODO: Add a sorting method to sort your favorites by rating of 1-5 stars

//TODO: Add a method to add a library if you already created it on boardgamegeek.com


