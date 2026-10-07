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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';

const expenseCategories = ['Inventory', 'Utilities', 'Rent', 'Salaries', 'Maintenance', 'Marketing', 'Other'];
const emptyFixedCost = { name: '', category: 'Utilities', amount: '' };
const investmentCutoffDate = '2026-10-02';
const investmentManagerEmail = 'matamsamsujanp@gmail.com';
const emptyInvestment = {
  description: '',
  category: 'Inventory',
  amount: '',
  date: investmentCutoffDate,
  paymentMethod: 'Cash',
  ownerId: '',
};

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const isOwner = user?.role === 'owner';
  const isInvestmentManager = user?.email?.toLowerCase() === investmentManagerEmail;
  const canManageInvestments = isOwner || isInvestmentManager;
  const [expenses, setExpenses] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [fixedCostDrafts, setFixedCostDrafts] = useState({});
  const [fixedCostError, setFixedCostError] = useState('');
  const [openFixedCostDialog, setOpenFixedCostDialog] = useState(false);
  const [newFixedCost, setNewFixedCost] = useState(emptyFixedCost);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openInvestmentDialog, setOpenInvestmentDialog] = useState(false);
  const [investmentDraft, setInvestmentDraft] = useState(emptyInvestment);
  const [editingInvestmentId, setEditingInvestmentId] = useState(null);
  const [investmentError, setInvestmentError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Inventory',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
  });

  useEffect(() => {
    if (canManageInvestments) {
      fetchExpenses();
      fetchOwners();
      if (isOwner) fetchFixedCosts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const [investmentRes, ownerOnlyResults] = await Promise.all([
        API.get('/expenses/investments'),
        isOwner
          ? Promise.all([API.get('/expenses'), API.get('/analytics/expenses-summary')])
          : Promise.resolve(null),
      ]);
      setInvestments(investmentRes.data);
      if (ownerOnlyResults) {
        setExpenses(ownerOnlyResults[0].data.filter((expense) => expense.date.slice(0, 10) > investmentCutoffDate));
        setSummary(ownerOnlyResults[1].data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await API.get('/expenses/owners');
      setOwners(response.data);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
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

  const openNewInvestment = () => {
    setInvestmentDraft({
      ...emptyInvestment,
      ownerId: isInvestmentManager && !isOwner ? owners[0]?.id || '' : user.id,
    });
    setEditingInvestmentId(null);
    setInvestmentError('');
    setOpenInvestmentDialog(true);
  };

  const openInvestmentForEdit = (investment) => {
    setInvestmentDraft({
      description: investment.description,
      category: investment.category,
      amount: String(investment.amount),
      date: investment.date.slice(0, 10),
      paymentMethod: investment.paymentMethod,
      ownerId: investment.owner?.id || investment.owner_id || investment.created_by || '',
    });
    setEditingInvestmentId(investment._id);
    setInvestmentError('');
    setOpenInvestmentDialog(true);
  };

  const handleSaveInvestment = async () => {
    setInvestmentError('');
    if (!investmentDraft.description.trim() || !investmentDraft.amount || Number(investmentDraft.amount) <= 0) {
      setInvestmentError('Enter a description and a valid amount');
      return;
    }
    if (investmentDraft.date > investmentCutoffDate) {
      setInvestmentError('Investment date must be on or before October 2, 2026');
      return;
    }
    if (!investmentDraft.ownerId) {
      setInvestmentError('Select an owner for this investment');
      return;
    }
    const payload = {
      ...investmentDraft,
      amount: Number(investmentDraft.amount),
    };
    try {
      if (editingInvestmentId) {
        await API.put(`/expenses/investments/${editingInvestmentId}`, payload);
      } else {
        await API.post('/expenses', payload);
      }
      setOpenInvestmentDialog(false);
      await fetchExpenses();
    } catch (error) {
      setInvestmentError(error.response?.data?.error || 'Could not save investment');
    }
  };

  const totalsByOwner = owners.map((owner) => ({
    ...owner,
    total: investments
      .filter((investment) => (investment.owner?.id || investment.owner_id || investment.created_by) === owner.id)
      .reduce((total, investment) => total + Number(investment.amount), 0),
  }));
  const totalInvestmentPaise = totalsByOwner.reduce((total, owner) => total + Math.round(owner.total * 100), 0);
  const totalInvestments = totalInvestmentPaise / 100;
  const baseSharePaise = owners.length ? Math.floor(totalInvestmentPaise / owners.length) : 0;
  const extraSharePaise = owners.length ? totalInvestmentPaise % owners.length : 0;
  const balances = totalsByOwner.map((owner, index) => {
    const ownerSharePaise = baseSharePaise + (index < extraSharePaise ? 1 : 0);
    return { ...owner, balance: (Math.round(owner.total * 100) - ownerSharePaise) / 100 };
  });
  const debtors = balances.filter((owner) => owner.balance < 0).map((owner) => ({ ...owner, remainingPaise: Math.round(-owner.balance * 100) }));
  const creditors = balances.filter((owner) => owner.balance > 0).map((owner) => ({ ...owner, remainingPaise: Math.round(owner.balance * 100) }));
  const settlements = [];
  debtors.forEach((debtor) => {
    creditors.forEach((creditor) => {
      const amountPaise = Math.min(debtor.remainingPaise, creditor.remainingPaise);
      if (amountPaise > 0) {
        settlements.push({ from: debtor.name, to: creditor.name, amount: amountPaise / 100 });
        debtor.remainingPaise -= amountPaise;
        creditor.remainingPaise -= amountPaise;
      }
    });
  });

  if (!canManageInvestments && !loading) {
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          flexWrap: 'wrap',
          gap: 2,
          borderRadius: 5,
          background: 'linear-gradient(115deg, rgba(104,70,47,0.09) 0%, rgba(200,154,98,0.14) 100%)',
          border: '1px solid rgba(104,70,47,0.09)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 58,
              height: 58,
              borderRadius: '19px',
              color: '#68462f',
              bgcolor: 'rgba(255,253,250,0.8)',
              boxShadow: '0 7px 18px rgba(57,39,25,0.08)',
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 29 }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: '#a17851', fontWeight: 700, letterSpacing: '0.14em' }}>
              OWNER FINANCE
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700, lineHeight: 1.05 }}
            >
              Expenses
            </Typography>
            <Typography variant="body2" sx={{ color: '#82766a', mt: 0.5 }}>
              Review owner contributions and operating expenses
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            sx={{ borderColor: '#68462f', color: '#68462f' }}
            startIcon={<AddIcon />}
            onClick={openNewInvestment}
          >
            Add Investment
          </Button>
          {isOwner && (
            <Button
              variant="contained"
              sx={{ bgcolor: '#68462f', px: 2.25, '&:hover': { bgcolor: '#503622' } }}
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Expense
            </Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 4, borderRadius: '12px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#503622' }}>Investments</Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>Transactions dated through October 2, 2026</Typography>
            </Box>
            <Typography variant="h6" sx={{ color: '#68462f', fontWeight: 700 }}>₹{totalInvestments.toFixed(2)}</Typography>
          </Box>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eee', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                  <TableCell>Owner</TableCell>
                  <TableCell align="right">Invested (₹)</TableCell>
                  <TableCell align="right">Balance vs equal share (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {balances.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>{owner.name}</TableCell>
                    <TableCell align="right">₹{owner.total.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: owner.balance >= 0 ? '#287a48' : '#b33b31', fontWeight: 600 }}>
                      {owner.balance >= 0 ? 'Receives ' : 'Owes '}₹{Math.abs(owner.balance).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {balances.length === 0 && <TableRow><TableCell colSpan={3} align="center">No owners found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {settlements.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Suggested transfers</Typography>
              {settlements.map((settlement, index) => (
                <Box key={`${settlement.from}-${settlement.to}-${index}`}>
                  {settlement.from} pays {settlement.to} ₹{settlement.amount.toFixed(2)}
                </Box>
              ))}
            </Alert>
          )}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eee' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount (₹)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investments.map((investment) => {
                  const ownerId = investment.owner?.id || investment.owner_id || investment.created_by;
                  const canEdit = isInvestmentManager || ownerId === user.id;
                  return (
                    <TableRow key={investment._id}>
                      <TableCell>{new Date(investment.date).toLocaleDateString()}</TableCell>
                      <TableCell>{investment.owner?.name || owners.find((owner) => owner.id === ownerId)?.name || 'Unassigned'}</TableCell>
                      <TableCell>{investment.description}</TableCell>
                      <TableCell>{investment.category}</TableCell>
                      <TableCell align="right">₹{Number(investment.amount).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        {canEdit && <IconButton size="small" onClick={() => openInvestmentForEdit(investment)} title="Edit investment"><EditIcon fontSize="small" /></IconButton>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {investments.length === 0 && <TableRow><TableCell colSpan={6} align="center">No investments recorded through October 2, 2026.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Fixed Monthly Costs */}
      {isOwner && <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#503622' }}>
              Fixed Monthly Costs
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
      </Card>}

      {/* Summary Cards */}
      {isOwner && <Grid container spacing={3} sx={{ mb: 4 }}>
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
      </Grid>}

      {/* Expenses Table */}
      {isOwner && <Card sx={{ borderRadius: '12px' }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#503622' }}>Expenses</Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>Transactions dated October 3, 2026 onward</Typography>
          </Box>
        </CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                <TableCell>Date</TableCell>
                <TableCell>Owner</TableCell>
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
                  <TableCell>{owners.find((owner) => owner.id === (expense.owner_id || expense.created_by))?.name || 'Unassigned'}</TableCell>
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
      </Card>}

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

      <Dialog open={openInvestmentDialog} onClose={() => setOpenInvestmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingInvestmentId ? 'Update Investment' : 'Add Investment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {investmentError && <Alert severity="error">{investmentError}</Alert>}
            <TextField
              fullWidth
              label="Description"
              value={investmentDraft.description}
              onChange={(event) => setInvestmentDraft({ ...investmentDraft, description: event.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={investmentDraft.category}
                label="Category"
                onChange={(event) => setInvestmentDraft({ ...investmentDraft, category: event.target.value })}
              >
                {expenseCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              value={investmentDraft.amount}
              onChange={(event) => setInvestmentDraft({ ...investmentDraft, amount: event.target.value })}
              inputProps={{ min: 0.01, step: '0.01' }}
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={investmentDraft.date}
              onChange={(event) => setInvestmentDraft({ ...investmentDraft, date: event.target.value })}
              inputProps={{ max: investmentCutoffDate }}
              InputLabelProps={{ shrink: true }}
            />
            {isInvestmentManager && (
              <FormControl fullWidth>
                <InputLabel>Owner</InputLabel>
                <Select
                  value={investmentDraft.ownerId}
                  label="Owner"
                  onChange={(event) => setInvestmentDraft({ ...investmentDraft, ownerId: event.target.value })}
                >
                  {owners.map((owner) => <MenuItem key={owner.id} value={owner.id}>{owner.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={investmentDraft.paymentMethod}
                label="Payment Method"
                onChange={(event) => setInvestmentDraft({ ...investmentDraft, paymentMethod: event.target.value })}
              >
                {['Cash', 'Card', 'UPI', 'Online'].map((method) => <MenuItem key={method} value={method}>{method}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenInvestmentDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" sx={{ bgcolor: '#6f4e37' }} onClick={handleSaveInvestment}>
                Save Investment
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
