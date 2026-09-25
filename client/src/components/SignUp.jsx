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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CoffeeIcon from '@mui/icons-material/LocalCafe';

const SignUp = ({ onLoginClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/register', formData);
      dispatch(setAuth(response.data));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
              Join Maná Corner
            </Typography>
          </Box>

          <form onSubmit={handleSignUp}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="owner">Owner</MenuItem>
                <MenuItem value="guest">Guest (Billing Only)</MenuItem>
              </Select>
            </FormControl>

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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                onClick={onLoginClick}
                sx={{ cursor: 'pointer', color: '#6f4e37', fontWeight: 600 }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default SignUp;
