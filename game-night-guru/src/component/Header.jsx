import React from 'react';
import { Link } from 'react-router-dom';
import { Dice5 } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Dice5 size={36} className="logo-icon" />
          <h1 className="app-title">Game Night Guru</h1>
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