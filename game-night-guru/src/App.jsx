import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './component/Header';
import Home from './component/Home';
import gamelibrary from './component/gamelibrary';
import Library from './component/Library';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            {/* We'll add an About route later */}
            <Route path="/about" element={<h2>About Page (Coming Soon)</h2>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;