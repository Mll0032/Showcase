import React from 'react';
import { Link } from 'react-router-dom';



const SwirlingNexus = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="swirl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff00cc" />
        <stop offset="100%" stopColor="#3333ff" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#glow)">
      <path d="M50 10 
               A40 40 0 0 1 90 50 
               A40 40 0 0 1 50 90 
               A40 40 0 0 1 10 50 
               A40 40 0 0 1 50 10 
               Z" 
            fill="none" stroke="url(#swirl)" strokeWidth="5">
        <animateTransform attributeName="transform" 
                          type="rotate" 
                          from="0 50 50" 
                          to="360 50 50" 
                          dur="8s" 
                          repeatCount="indefinite" />
      </path>
      <circle cx="50" cy="50" r="7" fill="#ff3399">
        <animate attributeName="r" 
                 values="7;12;7" 
                 dur="5s" 
                 repeatCount="indefinite" />
      </circle>
    </g>
  </svg>
);


const Header = () => {
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // Redirect to homepage after logout
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <SwirlingNexus />
          <h1 className="app-title">Game Night Nexus</h1>
        </div>
        <nav>
          <ul className="nav-list">
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/library" className="nav-link">Library</Link></li>
            <li><Link to="/about" className="nav-link">About</Link></li>
            {!token && (
              <>
                <li><Link to="/signup" className="nav-link">Sign Up</Link></li>
                <li><Link to="/login" className="nav-link">Login</Link></li>
              </>
            )}
            {token && (
              <li><button onClick={handleLogout} className="nav-link">Logout</button></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;