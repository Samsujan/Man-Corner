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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        background: 'radial-gradient(circle at top left, #f8f2ec 0%, #ede2d4 45%, #e3d2bb 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            padding: { xs: 3, sm: 5 },
            width: '100%',
            boxShadow: '0 20px 60px rgba(74, 49, 32, 0.2)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 165, 116, 0.35)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6f4e37 0%, #4a3120 100%)',
                mb: 2,
                boxShadow: '0 8px 24px rgba(111, 78, 55, 0.35)',
              }}
            >
              <CoffeeIcon sx={{ fontSize: 36, color: '#f8f2ec' }} />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Playfair Display', serif",
                color: '#4a3120',
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Maná Corner
            </Typography>
            <Typography variant="body1" sx={{ color: '#a3846b', fontStyle: 'italic' }}>
              Something to Eat
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

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
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #6f4e37 0%, #4a3120 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #5c3f2c 0%, #3a2718 100%)' },
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
      </Container>
    </Box>
  );
};

export default Login;
