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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Billing = () => {
  const { user } = useSelector((state) => state.auth);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, billsRes] = await Promise.all([
        API.get('/menu'),
        API.get('/billing'),
      ]);
      setMenuItems(menuRes.data);
      setBills(billsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToBill = (item) => {
    const existingItem = selectedItems.find((i) => i.menuItem._id === item._id);
    if (existingItem) {
      existingItem.quantity += 1;
      setSelectedItems([...selectedItems]);
    } else {
      setSelectedItems([
        ...selectedItems,
        { menuItem: item, quantity: 1, gstRate: item.gstRate },
      ]);
    }
  };

  const removeItemFromBill = (itemId) => {
    setSelectedItems(selectedItems.filter((i) => i.menuItem._id !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const itemTotal = item.menuItem.price * item.quantity;
      const gst = (itemTotal * item.gstRate) / 100;
      return sum + itemTotal + gst;
    }, 0);
  };

  const calculateGST = () => {
    return selectedItems.reduce((sum, item) => {
      const itemTotal = item.menuItem.price * item.quantity;
      const gst = (itemTotal * item.gstRate) / 100;
      return sum + gst;
    }, 0);
  };

  const handleCreateBill = async () => {
    try {
      const billData = {
        items: selectedItems.map((item) => ({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      await API.post('/billing', billData);
      alert('✅ Bill created successfully!');
      setSelectedItems([]);
      setPaymentMethod('Cash');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create bill:', error);
      alert('❌ Failed to create bill');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'Playfair Display', serif",
          color: '#6f4e37',
          fontWeight: 700,
          mb: 3,
        }}
      >
        💳 Billing
      </Typography>

      <Grid container spacing={3}>
        {/* Menu Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Select Items
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {menuItems.map((item) => (
                  <Card key={item._id} sx={{ p: 2, bgcolor: '#f5f3f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          ₹{item.price} (GST: {item.gstRate}%)
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#6f4e37' }}
                        onClick={() => addItemToBill(item)}
                      >
                        <AddIcon />
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bill Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', position: 'sticky', top: 100 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bill Summary
              </Typography>

              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.map((item) => {
                      const itemTotal = item.menuItem.price * item.quantity;
                      return (
                        <TableRow key={item.menuItem._id}>
                          <TableCell>{item.menuItem.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{itemTotal}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeItemFromBill(item.menuItem._id)}
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ bgcolor: '#f5f3f0', p: 2, borderRadius: '8px', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    ₹
                    {selectedItems
                      .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
                      .toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>GST:</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#3498db' }}>
                    ₹{calculateGST().toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '2px solid #ddd' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Total:</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#6f4e37' }}>
                    ₹{calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#6f4e37', py: 1.5 }}
                disabled={selectedItems.length === 0}
                onClick={() => setOpenDialog(true)}
              >
                Complete Billing
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Billing Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Billing</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ mb: 2 }}>
              Total Amount: <strong>₹{calculateTotal().toFixed(2)}</strong>
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Online">Online Transfer</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#6f4e37' }}
                onClick={handleCreateBill}
              >
                Create Bill
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Recent Bills */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recent Bills
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                <TableCell>Bill ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.slice(0, 5).map((bill) => (
                <TableRow key={bill._id}>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {bill.billNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">₹{bill.total.toFixed(2)}</TableCell>
                  <TableCell>{bill.paymentMethod}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#d4edda',
                        color: '#155724',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {bill.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Billing;
