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
import CollectionDetail from './pages/CollectionDetail';
import ReaderView from './pages/ReaderView';
import BriefingPage from './pages/Briefing';
import BriefingDetail from './pages/BriefingDetail';

import { VoiceSessionProvider } from './features/voice-session/VoiceSessionContext';

function App() {
  return (
    <Router>
      <VoiceSessionProvider>
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
          <Route
            path="/collections/:id"
            element={
              <ProtectedRoute>
                <CollectionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reader"
            element={
              <ProtectedRoute>
                <ReaderView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/briefing"
            element={
              <ProtectedRoute>
                <BriefingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/briefing/:id"
            element={
              <ProtectedRoute>
                <BriefingDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
        </AppShell>
      </VoiceSessionProvider>
    </Router>
  );
}

export default App;