import React, { useEffect, useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { printBillReceipt } from '../utils/printReceipt';

const MenuItemPhoto = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Box
      sx={{
        width: 76,
        height: 70,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: '15px',
        color: '#8a6b4c',
        bgcolor: '#f5ede2',
        border: '1px solid rgba(104,70,47,0.08)',
      }}
    >
      {item.image && !imageFailed ? (
        <Box
          component="img"
          src={item.image}
          alt={item.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <RestaurantMenuIcon sx={{ fontSize: 31 }} />
      )}
    </Box>
  );
};

const Billing = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

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

  const categories = useMemo(() => {
    const seen = [];
    menuItems.forEach((item) => {
      if (!seen.includes(item.category)) seen.push(item.category);
    });
    return ['All', ...seen];
  }, [menuItems]);

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, search]);

  const getQuantity = (itemId) =>
    selectedItems.find((i) => i.menuItem._id === itemId)?.quantity || 0;

  const addItemToBill = (item) => {
    const existingItem = selectedItems.find((i) => i.menuItem._id === item._id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.menuItem._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        { menuItem: item, quantity: 1, gstRate: item.gstRate },
      ]);
    }
  };

  const decrementItem = (itemId) => {
    const existingItem = selectedItems.find((i) => i.menuItem._id === itemId);
    if (!existingItem) return;
    if (existingItem.quantity <= 1) {
      removeItemFromBill(itemId);
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.menuItem._id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
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

      const response = await API.post('/billing', billData);
      setSelectedItems([]);
      setPaymentMethod('Cash');
      setOpenDialog(false);
      printBillReceipt(response.data);
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 5,
          background: 'linear-gradient(115deg, rgba(104,70,47,0.09) 0%, rgba(200,154,98,0.14) 100%)',
          border: '1px solid rgba(104,70,47,0.09)',
        }}
      >
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
          <PointOfSaleIcon sx={{ fontSize: 29 }} />
        </Box>
        <Box>
          <Typography variant="overline" sx={{ color: '#a17851', fontWeight: 700, letterSpacing: '0.14em' }}>
            FRONT OF HOUSE
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700, lineHeight: 1.05 }}
          >
            Billing
          </Typography>
          <Typography variant="body2" sx={{ color: '#82766a', mt: 0.5 }}>
            Build an order, review the total, and print a GST receipt
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Menu Selection */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(111, 78, 55, 0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Select Items
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search dishes…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#a08670' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Tabs
                value={activeCategory}
                onChange={(event, value) => setActiveCategory(value)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  mb: 2,
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '20px',
                    mr: 1,
                    color: '#6f4e37',
                  },
                  '& .Mui-selected': {
                    bgcolor: '#6f4e37',
                    color: '#fff !important',
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                {categories.map((category) => (
                  <Tab key={category} value={category} label={category} />
                ))}
              </Tabs>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {visibleItems.map((item) => {
                  const quantity = getQuantity(item._id);
                  return (
                    <Box key={item._id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: '16px',
                          borderColor: quantity > 0 ? '#98745b' : 'rgba(104,70,47,0.13)',
                          bgcolor: quantity > 0 ? '#f7f0e7' : '#fffefa',
                          transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                          '&:hover': {
                            borderColor: '#98745b',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <MenuItemPhoto item={item} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.3, color: '#3b3027' }}>
                              {item.name}
                            </Typography>
                            {item.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: '#87796d',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  mt: 0.35,
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ color: '#68462f', fontWeight: 700, mt: 0.5 }}>
                              ₹{Number(item.price).toFixed(2)}
                              <Typography component="span" variant="caption" sx={{ color: '#8b7d71', ml: 1, fontWeight: 500 }}>
                                GST {item.gstRate}%
                              </Typography>
                            </Typography>
                          </Box>
                          {quantity === 0 ? (
                            <IconButton
                              aria-label={`Add ${item.name}`}
                              onClick={() => addItemToBill(item)}
                              sx={{
                                width: 42,
                                height: 42,
                                flexShrink: 0,
                                bgcolor: '#68462f',
                                color: '#fff',
                                '&:hover': { bgcolor: '#503622' },
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
                              <IconButton
                                aria-label={`Remove one ${item.name}`}
                                onClick={() => decrementItem(item._id)}
                                sx={{ width: 36, height: 36, bgcolor: '#eee5da', '&:hover': { bgcolor: '#e5d8c8' } }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ minWidth: 22, textAlign: 'center', fontWeight: 700, color: '#503622' }}>
                                {quantity}
                              </Typography>
                              <IconButton
                                aria-label={`Add one ${item.name}`}
                                onClick={() => addItemToBill(item)}
                                sx={{ width: 36, height: 36, bgcolor: '#68462f', color: '#fff', '&:hover': { bgcolor: '#503622' } }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </Box>
                  );
                })}
                {visibleItems.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#888' }}>
                    <RestaurantMenuIcon sx={{ fontSize: 34, color: '#b9a58f', mb: 1 }} />
                    <Typography>
                      No dishes match your search.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bill Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '16px', position: 'sticky', top: 100, boxShadow: '0 4px 20px rgba(111, 78, 55, 0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Bill Summary
              </Typography>

              {selectedItems.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">Tap + on a dish to start a bill.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none', border: '1px solid #eee2d8' }}>
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
                            <TableCell align="right">₹{itemTotal.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeItemFromBill(item.menuItem._id)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ bgcolor: '#f5f3f0', p: 2, borderRadius: '12px', mb: 2 }}>
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
                sx={{ bgcolor: '#6f4e37', py: 1.5, borderRadius: '10px' }}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
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
                sx={{ bgcolor: '#6f4e37', borderRadius: '10px' }}
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
        <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(111, 78, 55, 0.08)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                <TableCell>Bill ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.slice(0, 5).map((bill) => (
                <TableRow key={bill._id} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {bill.billNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">₹{bill.total.toFixed(2)}</TableCell>
                  <TableCell>{bill.paymentMethod}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={bill.status}
                      sx={{
                        bgcolor: '#d4edda',
                        color: '#155724',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => printBillReceipt(bill)} title="Print bill">
                      <PrintIcon fontSize="small" sx={{ color: '#6f4e37' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No bills created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Billing;
