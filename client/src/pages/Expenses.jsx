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
  IconButton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const expenseCategories = ['Inventory', 'Utilities', 'Rent', 'Salaries', 'Maintenance', 'Marketing', 'Other'];
const emptyFixedCost = { name: '', category: 'Utilities', amount: '' };

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [fixedCostDrafts, setFixedCostDrafts] = useState({});
  const [fixedCostError, setFixedCostError] = useState('');
  const [openFixedCostDialog, setOpenFixedCostDialog] = useState(false);
  const [newFixedCost, setNewFixedCost] = useState(emptyFixedCost);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [receipt, setReceipt] = useState(null);
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
      fetchFixedCosts();
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

  const fetchFixedCosts = async () => {
    try {
      const response = await API.get('/fixed-costs');
      setFixedCosts(response.data);
      setFixedCostDrafts(
        Object.fromEntries(response.data.map((cost) => [cost._id, String(cost.amount ?? '')]))
      );
    } catch (error) {
      console.error('Failed to fetch fixed costs:', error);
    }
  };

  const handleFixedCostDraftChange = (id, value) => {
    setFixedCostDrafts({ ...fixedCostDrafts, [id]: value });
  };

  const saveFixedCostAmount = async (cost) => {
    setFixedCostError('');
    const value = Number(fixedCostDrafts[cost._id]);
    if (!Number.isFinite(value) || value < 0) {
      setFixedCostError('Enter a valid non-negative amount');
      return;
    }
    try {
      await API.put(`/fixed-costs/${cost._id}`, { amount: value });
      await Promise.all([fetchFixedCosts(), fetchExpenses()]);
    } catch (error) {
      setFixedCostError(error.response?.data?.error || 'Could not update fixed cost');
    }
  };

  const handleAddFixedCost = async () => {
    setFixedCostError('');
    if (!newFixedCost.name.trim() || newFixedCost.amount === '' || Number(newFixedCost.amount) < 0) {
      setFixedCostError('Provide a name and a valid amount');
      return;
    }
    try {
      await API.post('/fixed-costs', {
        name: newFixedCost.name.trim(),
        category: newFixedCost.category,
        amount: Number(newFixedCost.amount),
      });
      setNewFixedCost(emptyFixedCost);
      setOpenFixedCostDialog(false);
      await Promise.all([fetchFixedCosts(), fetchExpenses()]);
    } catch (error) {
      setFixedCostError(error.response?.data?.error || 'Could not add fixed cost');
    }
  };

  const handleDeleteFixedCost = async (cost) => {
    if (!window.confirm(`Remove "${cost.name}" from fixed costs? Past expense entries stay untouched.`)) return;
    try {
      await API.delete(`/fixed-costs/${cost._id}`);
      fetchFixedCosts();
    } catch (error) {
      alert(error.response?.data?.error || 'Could not remove fixed cost');
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
      if (receipt) data.append('billScreenshot', receipt);

      await API.post('/expenses', data);

      alert('✅ Expense added successfully!');
      setFormData({
        description: '',
        category: 'Inventory',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
      });
      setReceipt(null);
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

      {/* Fixed Monthly Costs */}
      <Card sx={{ borderRadius: '12px', mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🏷️ Fixed Monthly Costs
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenFixedCostDialog(true)}>
              Add fixed cost
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
            Salary, rent, power, wifi, and water are fixed line items every month — just keep the amount
            updated and it's automatically logged as this month's expense.
          </Typography>
          {fixedCostError && <Alert severity="error" sx={{ mb: 2 }}>{fixedCostError}</Alert>}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eee' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                  <TableCell>Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount (₹)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fixedCosts.map((cost) => (
                  <TableRow key={cost._id}>
                    <TableCell sx={{ fontWeight: 600 }}>{cost.name}</TableCell>
                    <TableCell>{cost.category}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={fixedCostDrafts[cost._id] ?? ''}
                        onChange={(event) => handleFixedCostDraftChange(cost._id, event.target.value)}
                        sx={{ width: 120 }}
                        inputProps={{ min: 0, step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => saveFixedCostAmount(cost)} title="Save amount">
                        <SaveIcon fontSize="small" sx={{ color: '#6f4e37' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteFixedCost(cost)} title="Remove">
                        <DeleteOutlineIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {fixedCosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No fixed costs configured yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
                <TableCell>Receipt</TableCell>
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
                  <TableCell>
                    {expense.billScreenshot ? (
                      <a href={expense.billScreenshot} target="_blank" rel="noreferrer">View</a>
                    ) : '—'}
                  </TableCell>
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
              type="file"
              label="Receipt or payment screenshot"
              inputProps={{ accept: 'image/jpeg,image/png,image/webp,application/pdf' }}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setReceipt(event.target.files?.[0] || null)}
            />

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

      {/* Add Fixed Cost Dialog */}
      <Dialog open={openFixedCostDialog} onClose={() => setOpenFixedCostDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Fixed Monthly Cost</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fixedCostError && <Alert severity="error">{fixedCostError}</Alert>}
            <TextField
              fullWidth
              label="Name"
              value={newFixedCost.name}
              onChange={(event) => setNewFixedCost({ ...newFixedCost, name: event.target.value })}
              placeholder="e.g., Internet Backup Plan"
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newFixedCost.category}
                onChange={(event) => setNewFixedCost({ ...newFixedCost, category: event.target.value })}
                label="Category"
              >
                {expenseCategories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              value={newFixedCost.amount}
              onChange={(event) => setNewFixedCost({ ...newFixedCost, amount: event.target.value })}
              inputProps={{ min: 0, step: '0.01' }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenFixedCostDialog(false)}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" sx={{ bgcolor: '#6f4e37' }} onClick={handleAddFixedCost}>
                Add
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Expenses;
