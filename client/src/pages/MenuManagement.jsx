import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const categories = ['Coffee', 'Tea', 'Snacks', 'Pastries', 'Beverages', 'Desserts'];
const emptyItem = {
  name: '',
  category: 'Coffee',
  price: '',
  gstRate: 5,
  description: '',
};

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setError('');
    try {
      const response = await API.get('/menu');
      setItems(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load the menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setFormData(emptyItem);
    setError('');
    setOpen(true);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      gstRate: item.gstRate,
      description: item.description || '',
    });
    setError('');
    setOpen(true);
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await API.put(`/menu/${editingId}`, formData);
      } else {
        await API.post('/menu', formData);
      }
      setOpen(false);
      await fetchItems();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not save the menu item');
    } finally {
      setSaving(false);
    }
  };

  const deactivateItem = async (item) => {
    if (!window.confirm(`Remove ${item.name} from the active menu?`)) return;
    setError('');
    try {
      await API.delete(`/menu/${item._id}`);
      await fetchItems();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not remove the menu item');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h3"
          sx={{ fontFamily: "'Playfair Display', serif", color: '#6f4e37', fontWeight: 700 }}
        >
          Menu Management
        </Typography>
        <Button variant="contained" onClick={startCreate} sx={{ bgcolor: '#6f4e37' }}>
          Add menu item
        </Button>
      </Box>
      {error && !open && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                    <TableCell>Item</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                        {item.description && (
                          <Typography variant="caption" color="text.secondary">
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">₹{Number(item.price).toFixed(2)}</TableCell>
                      <TableCell align="right">{item.gstRate}%</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => startEdit(item)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => deactivateItem(item)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Add the cafe menu to start billing.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={saveItem}>
          <DialogTitle>{editingId ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoFocus
              required
              label="Item name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              required
              label="Price (₹)"
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={formData.price}
              onChange={(event) => setFormData({ ...formData, price: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>GST rate</InputLabel>
              <Select
                value={formData.gstRate}
                label="GST rate"
                onChange={(event) => setFormData({ ...formData, gstRate: event.target.value })}
              >
                {[5, 12, 18, 28].map((rate) => (
                  <MenuItem key={rate} value={rate}>{rate}%</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description (optional)"
              multiline
              minRows={2}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#6f4e37' }}>
              {saving ? 'Saving…' : 'Save item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default MenuManagement;
