import React from 'react';
import { Link } from 'react-router-dom';

const SwirlingNexus = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="swirl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8a2be2" />
        <stop offset="100%" stopColor="#4b0082" />
      </linearGradient>
    </defs>
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
                        dur="10s" 
                        repeatCount="indefinite" />
    </path>
    <circle cx="50" cy="50" r="5" fill="#9400d3">
      <animate attributeName="r" 
               values="5;10;5" 
               dur="5s" 
               repeatCount="indefinite" />
    </circle>
  </svg>
);

const Header = () => {
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
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;