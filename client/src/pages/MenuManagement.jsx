import React, { useEffect, useMemo, useState } from 'react';
import API from '../utils/api';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

const emptyItem = {
  name: '',
  category: '',
  price: '',
  gstRate: 5,
  description: '',
};

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  const fetchAll = async () => {
    setError('');
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        API.get('/menu'),
        API.get('/menu/categories'),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load the menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const groupedItems = useMemo(() => {
    const groups = new Map();
    categories.forEach((category) => groups.set(category.name, []));
    items.forEach((item) => {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    });
    return Array.from(groups.entries());
  }, [items, categories]);

  const startCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyItem, category: categories[0]?.name || '' });
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
      await fetchAll();
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
      await fetchAll();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not remove the menu item');
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySaving(true);
    setCategoryError('');
    try {
      const response = await API.post('/menu/categories', { name: newCategoryName.trim() });
      setCategories((prev) => [...prev, response.data]);
      setFormData((prev) => ({ ...prev, category: prev.category || response.data.name }));
      setNewCategoryName('');
    } catch (requestError) {
      setCategoryError(requestError.response?.data?.error || 'Could not add the category');
    } finally {
      setCategorySaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    setCategoryError('');
    try {
      await API.delete(`/menu/categories/${category._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
    } catch (requestError) {
      setCategoryError(requestError.response?.data?.error || 'Could not delete the category');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h3"
            sx={{ fontFamily: "'Playfair Display', serif", color: '#6f4e37', fontWeight: 700 }}
          >
            Menu Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#8a7566' }}>
            Organise dishes by meal time — Breakfast, Lunch, Weekend Biryani, Evening Snacks, and Tea &amp; Coffee.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setCategoryDialogOpen(true)}
            sx={{ borderColor: '#6f4e37', color: '#6f4e37', borderRadius: '10px' }}
          >
            Manage categories
          </Button>
          <Button
            variant="contained"
            onClick={startCreate}
            disabled={categories.length === 0}
            sx={{ bgcolor: '#6f4e37', borderRadius: '10px' }}
          >
            Add menu item
          </Button>
        </Stack>
      </Box>
      {error && !open && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {categories.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add at least one category (e.g. Breakfast) before creating menu items.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {groupedItems.map(([categoryName, categoryItems]) => (
            <Accordion
              key={categoryName}
              defaultExpanded
              disableGutters
              sx={{
                borderRadius: '14px !important',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(111, 78, 55, 0.08)',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ bgcolor: '#f5f3f0', '&:hover': { bgcolor: '#efe9e2' } }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <RestaurantMenuIcon sx={{ color: '#6f4e37' }} />
                  <Typography sx={{ fontWeight: 700, color: '#4a3120' }}>{categoryName}</Typography>
                  <Chip
                    size="small"
                    label={`${categoryItems.length} item${categoryItems.length === 1 ? '' : 's'}`}
                    sx={{ bgcolor: '#e8c9b0', color: '#4a3120', fontWeight: 600 }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {categoryItems.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Typography color="text.secondary">No items in this category yet.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fbf9f7' }}>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">GST</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryItems.map((item) => (
                          <TableRow key={item._id} hover>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                              {item.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.description}
                                </Typography>
                              )}
                            </TableCell>
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
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <form onSubmit={saveItem}>
          <DialogTitle sx={{ fontFamily: "'Playfair Display', serif", color: '#6f4e37' }}>
            {editingId ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoFocus
              required
              label="Item name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category.name}>{category.name}</MenuItem>
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
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#6f4e37', borderRadius: '10px' }}>
              {saving ? 'Saving…' : 'Save item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontFamily: "'Playfair Display', serif", color: '#6f4e37' }}>
          Manage categories
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {categoryError && <Alert severity="error">{categoryError}</Alert>}
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {categories.map((category) => (
              <Chip
                key={category._id}
                label={category.name}
                onDelete={() => removeCategory(category)}
                deleteIcon={
                  <Tooltip title="Delete category">
                    <CloseIcon fontSize="small" />
                  </Tooltip>
                }
                sx={{ bgcolor: '#f5f3f0', fontWeight: 600 }}
              />
            ))}
            {categories.length === 0 && (
              <Typography variant="body2" color="text.secondary">No categories yet — add your first below.</Typography>
            )}
          </Stack>
          <form onSubmit={addCategory}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Desserts"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={categorySaving || !newCategoryName.trim()}
                sx={{ bgcolor: '#6f4e37', whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                Add
              </Button>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCategoryDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement;
