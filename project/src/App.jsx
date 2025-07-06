import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Scholarships from './pages/Scholarships';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scholarships" element={<Scholarships />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;