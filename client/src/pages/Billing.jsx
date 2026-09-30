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
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import {
  getCompactBillNumber,
  getBillTokenNumber,
  printBillReceipts,
} from '../utils/printReceipt';
import {
  printBillToBluetoothPrinter,
  isBluetoothPrintSupported,
} from '../utils/blePrinter';

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

const formatBillDate = (bill) => {
  const value = bill.createdAt || bill.created_at;
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
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
    return Number(selectedItems
      .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
      .toFixed(2));
  };

  const calculateGST = () => {
    return selectedItems.reduce((sum, item) => {
      const inclusiveTotal = Number((item.menuItem.price * item.quantity).toFixed(2));
      const gst = Number((inclusiveTotal * item.gstRate / (100 + item.gstRate)).toFixed(2));
      return sum + gst;
    }, 0);
  };

  const [printingBillId, setPrintingBillId] = useState(null);
  const [lastBill, setLastBill] = useState(null);

  const handlePrintBoth = async (bill) => {
    setPrintingBillId(bill._id);
    try {
      if (isBluetoothPrintSupported()) {
        await printBillToBluetoothPrinter(bill);
      } else {
        printBillReceipts(bill);
      }
    } catch (error) {
      console.error('Receipt printing failed:', error);
      alert(`❌ Printing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setPrintingBillId(null);
    }
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
      setLastBill(response.data);
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
          Tap item icons, confirm GST-inclusive prices, and print both receipts
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

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                    lg: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 1.5,
                }}
              >
                {visibleItems.map((item) => {
                  const quantity = getQuantity(item._id);
                  return (
                    <Card
                      key={item._id}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.9 }}>
                        <Box sx={{ position: 'relative' }}>
                          <MenuItemPhoto item={item} />
                          {quantity > 0 && (
                            <Chip
                              size="small"
                              label={quantity}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                minWidth: 22,
                                height: 22,
                                fontWeight: 700,
                                bgcolor: '#68462f',
                                color: '#fff',
                                '& .MuiChip-label': { px: 0.9 },
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: '#3b3027',
                            textAlign: 'center',
                            lineHeight: 1.25,
                            minHeight: 34,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#68462f', fontWeight: 700 }}>
                          ₹{Number(item.price).toFixed(2)}
                          <Typography component="span" variant="caption" sx={{ color: '#8b7d71', ml: 0.5, fontWeight: 500 }}>
                            incl. GST
                          </Typography>
                        </Typography>
                        {quantity === 0 ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon fontSize="small" />}
                            onClick={() => addItemToBill(item)}
                            sx={{ bgcolor: '#68462f', borderRadius: '999px', px: 1.5, '&:hover': { bgcolor: '#503622' } }}
                          >
                            Add
                          </Button>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <IconButton
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => decrementItem(item._id)}
                              sx={{ width: 32, height: 32, bgcolor: '#eee5da', '&:hover': { bgcolor: '#e5d8c8' } }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ minWidth: 18, textAlign: 'center', fontWeight: 700, color: '#503622' }}>
                              {quantity}
                            </Typography>
                            <IconButton
                              aria-label={`Add one ${item.name}`}
                              onClick={() => addItemToBill(item)}
                              sx={{ width: 32, height: 32, bgcolor: '#68462f', color: '#fff', '&:hover': { bgcolor: '#503622' } }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  );
                })}
                {visibleItems.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#888', gridColumn: '1/-1' }}>
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
                  <Typography color="text.secondary">Tap any item icon to start a bill.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none', border: '1px solid #eee2d8' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Total incl. GST</TableCell>
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
                  <Typography>Items (incl. GST):</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    ₹
                    {selectedItems
                      .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
                      .toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>GST included:</Typography>
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
                <TableCell>Token</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Print</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.slice(0, 5).map((bill) => (
                <TableRow key={bill._id} hover>
                  <TableCell>
                    <Typography
                      variant="caption"
                      title={bill.billNumber}
                      sx={{
                        display: 'block',
                        maxWidth: 125,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#6f6257',
                      }}
                    >
                      {getCompactBillNumber(bill.billNumber)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={getBillTokenNumber(bill)} sx={{ fontWeight: 700, bgcolor: '#efe2d4', color: '#503622' }} />
                  </TableCell>
                  <TableCell>{formatBillDate(bill)}</TableCell>
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
                    <IconButton
                      size="small"
                      onClick={() => handlePrintBoth(bill)}
                      disabled={printingBillId === bill._id}
                      title="Print customer and kitchen receipts"
                    >
                      <ReceiptLongIcon fontSize="small" sx={{ color: '#6f4e37' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No bills created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Snackbar
        open={!!lastBill}
        autoHideDuration={8000}
        onClose={() => setLastBill(null)}
        message={lastBill ? `Bill ${getCompactBillNumber(lastBill.billNumber)} / Token ${getBillTokenNumber(lastBill)} created` : ''}
        action={
          lastBill ? (
            <Button
              size="small"
              startIcon={<ReceiptLongIcon fontSize="small" />}
              sx={{ color: '#90caf9' }}
              disabled={printingBillId === lastBill._id}
              onClick={() => handlePrintBoth(lastBill)}
            >
              Print both receipts
            </Button>
          ) : null
        }
      />
    </Container>
  );
};

export default Billing;
