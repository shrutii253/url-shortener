import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import UrlForm from './components/UrlForm';
import RedirectHandler from './components/RedirectHandler';

function App() {
  const location = useLocation();
  const pathname = location.pathname;

  // Check if this is a redirect route (any path that isn't the root)
  const isRedirectRoute = pathname !== '/';
  const shortId = pathname.slice(1); // Remove the leading slash

  useEffect(() => {
    // Update page title based on route
    if (isRedirectRoute) {
      document.title = `Snipr - Redirecting...`;
    } else {
      document.title = `Snipr - URL Shortener`;
    }
  }, [isRedirectRoute]);

  if (isRedirectRoute && shortId) {
    return <RedirectHandler />;
  }

  return <UrlForm />;
}

export default App;