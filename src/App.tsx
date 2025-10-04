import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import UrlForm from './components/UrlForm';
import RedirectHandler from './components/RedirectHandler';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<UrlForm />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Auth />} />
      <Route path=":shortId" element={<RedirectHandler />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;