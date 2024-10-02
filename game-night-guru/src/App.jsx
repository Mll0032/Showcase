import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './component/Header';
import Home from './component/Home';
import GameLibrary from './component/GameLibrary';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<GameLibrary />} />
            <Route path="/about" element={<h2>About Page (Coming Soon)</h2>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

