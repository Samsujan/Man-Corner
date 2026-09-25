import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/authSlice';
import API from '../utils/api';
import {
  Box,
  Button,
  Card,
  Container,
  TextField,
  Typography,
  Alert,
  Link,
  Paper,
} from '@mui/material';
import CoffeeIcon from '@mui/icons-material/LocalCafe';

const Login = ({ onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', { email, password });
      dispatch(setAuth(response.data));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f5f3f0',
        }}
      >
        <Card
          sx={{
            padding: 4,
            width: '100%',
            boxShadow: '0 8px 32px rgba(111, 78, 55, 0.15)',
            borderRadius: '16px',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <CoffeeIcon sx={{ fontSize: 48, color: '#6f4e37', mb: 2 }} />
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Playfair Display', serif",
                color: '#6f4e37',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Maná Corner
            </Typography>
            <Typography variant="body1" sx={{ color: '#888' }}>
              Cafe Management System
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              variant="outlined"
            />

            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.5,
                bgcolor: '#6f4e37',
                '&:hover': { bgcolor: '#4a3120' },
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                onClick={onSignUpClick}
                sx={{ cursor: 'pointer', color: '#6f4e37', fontWeight: 600 }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
