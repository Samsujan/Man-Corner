import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import SignUp from './components/SignUp';

// Pages
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Directory from './pages/Directory';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import ProfitShare from './pages/ProfitShare';
import Users from './pages/Users';
import MenuManagement from './pages/MenuManagement';

import { Box } from '@mui/material';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showSignUp, setShowSignUp] = useState(false);

  if (!isAuthenticated) {
    return (
      <Router>
        {showSignUp ? (
          <SignUp onLoginClick={() => setShowSignUp(false)} />
        ) : (
          <Login onSignUpClick={() => setShowSignUp(true)} />
        )}
      </Router>
    );
  }

  return (
    <Router>
      <Box sx={{ minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profit-share" element={<ProfitShare />} />
          <Route path="/users" element={<Users />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
