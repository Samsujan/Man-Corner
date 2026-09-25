import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../utils/api';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Inventory',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
  });

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchExpenses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        API.get('/expenses'),
        API.get('/analytics/expenses-summary'),
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddExpense = async () => {
    try {
      const data = new FormData();
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('amount', formData.amount);
      data.append('date', formData.date);
      data.append('paymentMethod', formData.paymentMethod);

      await API.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('✅ Expense added successfully!');
      setFormData({
        description: '',
        category: 'Inventory',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
      });
      setOpenDialog(false);
      fetchExpenses();
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('❌ Failed to add expense');
    }
  };

  if (!user?.role === 'owner' && !loading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Card sx={{ bgcolor: '#f8d7da', borderColor: '#f5c6cb' }}>
          <CardContent>
            <Typography sx={{ color: '#721c24' }}>
              🔒 Only owners can manage expenses. You have access to billing only.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Playfair Display', serif",
            color: '#6f4e37',
            fontWeight: 700,
          }}
        >
          💸 Expenses
        </Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: '#6f4e37' }}
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Expense
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Total Expenses
              </Typography>
              <Typography variant="h5" sx={{ color: '#6f4e37', fontWeight: 700 }}>
                ₹{summary?.totalExpenses?.toFixed(2) || '0'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {summary?.expenseCount || 0} entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Highest Category
              </Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 700 }}>
                {Object.entries(summary?.byCategory || {}).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                ₹{Object.entries(summary?.byCategory || {}).sort(([, a], [, b]) => b - a)[0]?.[1]?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Average per Entry
              </Typography>
              <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 700 }}>
                ₹
                {(
                  (summary?.totalExpenses || 0) / (summary?.expenseCount || 1)
                ).toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                Across all expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expenses Table */}
      <Card sx={{ borderRadius: '12px' }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense._id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#f5f3f0',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {expense.category}
                    </Box>
                  </TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#e74c3c' }}>
                    ₹{expense.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Coffee bean purchase"
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
              >
                <MenuItem value="Inventory">Inventory</MenuItem>
                <MenuItem value="Utilities">Utilities</MenuItem>
                <MenuItem value="Rent">Rent</MenuItem>
                <MenuItem value="Salaries">Salaries</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount (₹)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />

            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Online">Online Transfer</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#6f4e37' }}
                onClick={handleAddExpense}
                disabled={!formData.description || !formData.amount}
              >
                Add Expense
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Expenses;
