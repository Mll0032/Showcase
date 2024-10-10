import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './component/Header';
import Home from './component/Home';
import GameLibrary from './component/GameLibrary';
import About from './component/About'
import Signup from './component/SignupAndLogin';
import Login from './component/Login';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<GameLibrary />} />
            <Route path="/about" element={<About />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

