import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UrlForm from './components/UrlForm';
import RedirectHandler from './components/RedirectHandler';

function App() {
  return (
    <Routes>
      <Route path="/" element={<UrlForm />} />
      <Route path=":shortId" element={<RedirectHandler />} />
    </Routes>
  );
}

export default App;