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

const OwnerOnly = ({ user, children }) => (
  user?.role === 'owner' ? children : <Navigate to="/billing" replace />
);
const investmentManagerEmail = 'matamsamsujanp@gmail.com';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
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
          <Route path="/dashboard" element={<OwnerOnly user={user}><Dashboard /></OwnerOnly>} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/directory" element={<OwnerOnly user={user}><Directory /></OwnerOnly>} />
          <Route
            path="/expenses"
            element={user?.role === 'owner' || user?.email?.toLowerCase() === investmentManagerEmail
              ? <Expenses />
              : <Navigate to="/billing" replace />}
          />
          <Route path="/analytics" element={<OwnerOnly user={user}><Analytics /></OwnerOnly>} />
          <Route path="/profit-share" element={<OwnerOnly user={user}><ProfitShare /></OwnerOnly>} />
          <Route path="/users" element={<OwnerOnly user={user}><Users /></OwnerOnly>} />
          <Route path="/menu" element={<OwnerOnly user={user}><MenuManagement /></OwnerOnly>} />
          <Route path="/" element={<Navigate to={user?.role === 'owner' ? '/dashboard' : '/billing'} replace />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
