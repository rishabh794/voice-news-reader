import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function App() {
  return (
    <Router>
      <nav className="p-2.5 border-b border-gray-300 mb-5">
        <Link to="/" className="mr-2.5">Home</Link>
        <Link to="/login" className="mr-2.5">Login</Link>
        <Link to="/register" className="mr-2.5">Register</Link>
        <Link to="/dashboard" className="mr-2.5">Dashboard</Link>
        <Link to="/history">History</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;