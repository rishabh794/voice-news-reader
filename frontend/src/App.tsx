import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import VoiceAssistant from './components/VoiceAssistant';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import SavedArticles from './pages/SavedArticles';

function App() {
  return (
    <Router>
      <AppShell>
        <VoiceAssistant />
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
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedArticles />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;