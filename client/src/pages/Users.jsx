import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../utils/api';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const Users = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setError('');
    try {
      const response = await API.get('/users');
      setUsers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (user) => {
    setError('');
    try {
      await API.put(`/users/${user._id}`, {
        role: user.role === 'owner' ? 'guest' : 'owner',
      });
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not update account role');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete the account for ${user.name}?`)) return;
    setError('');
    try {
      await API.delete(`/users/${user._id}`);
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not delete account');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        sx={{ fontFamily: "'Playfair Display', serif", color: '#6f4e37', fontWeight: 700, mb: 1 }}
      >
        Account Management
      </Typography>
      <Typography sx={{ color: '#777', mb: 3 }}>
        Assign owner access or keep an account billing-only. New sign-ups start as guests.
      </Typography>
      {!loading && (
        <Typography sx={{ color: '#777', mb: 2 }}>
          {users.filter((user) => user.role === 'owner').length} owners ·{' '}
          {users.filter((user) => user.role === 'guest').length} billing accounts
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Access</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.role === 'owner' ? 'Owner · full access' : 'Guest · billing only'}
                      color={user.role === 'owner' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => changeRole(user)}
                      disabled={user._id === currentUser?.id && user.role === 'owner'}
                    >
                      {user.role === 'owner' ? 'Make guest' : 'Make owner'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteUser(user)}
                      disabled={user._id === currentUser?.id}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No accounts found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Users;
