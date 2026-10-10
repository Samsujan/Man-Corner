import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  Chip,
  IconButton,
  InputAdornment,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import {
  getCompactBillNumber,
  getBillTokenNumber,
  printBillReceipts,
  printCustomerBillReceipt,
  printKitchenTokenReceipt,
} from '../utils/printReceipt';
import {
  printBillToBluetoothPrinter,
  printFullBillToBluetoothPrinter,
  printKitchenTokenToBluetoothPrinter,
  isBluetoothPrintSupported,
} from '../utils/blePrinter';

const MENU_SUBCATEGORY_RULES = {
  Morning: [
    ['Dosas', /dosa/i],
    ['Poori', /poori/i],
    ['Idlis', /idli/i],
    ['Pongal', /pongal/i],
  ],
  Afternoon: [
    ['Biryani', /biryani|kobbari anam|single cb/i],
    ['Rice', /rice|bath|pulihora/i],
  ],
  'Evening Snacks': [
    ['Maggi', /maggi/i],
    ['Noodles', /noodles/i],
    ['Fried Rice', /fried rice/i],
    ['Sandwiches', /sandwich/i],
    ['Toasts', /toast/i],
    ['Fries', /fries/i],
    ['Starters', /.*/],
  ],
  Dinner: [
    ['Dosas', /dosa/i],
    ['Poori', /poori/i],
  ],
  'All Day Items': [
    ['Tea', /tea/i],
    ['Coffee', /coffee/i],
    ['Milkshakes', /milkshake/i],
    ['Drinks', /cool drinks|water/i],
    ['Extras', /^extra/i],
  ],
};

const getMenuSection = (category) => {
  const name = String(category || '').toLowerCase();
  if (name.includes('morning') || name === 'breakfast') return 'Morning';
  if (name.includes('afternoon') || name.includes('lunch')) return 'Afternoon';
  if (name.includes('evening') || name.includes('snack')) return 'Evening Snacks';
  if (name.includes('dinner')) return 'Dinner';
  if (name.includes('all day')) return 'All Day Items';
  return null;
};

const getItemSubcategory = (category, itemName) => {
  const rule = MENU_SUBCATEGORY_RULES[getMenuSection(category)]?.find(([, pattern]) => pattern.test(itemName));
  return rule?.[0] || 'Other';
};

const getCategoryLabel = (category) => category === 'Afternoon' ? 'Lunch' : category;

const MenuItemPhoto = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Box
      sx={{
        width: 44,
        height: 40,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: '9px',
        color: '#806112',
        bgcolor: '#fcf3d4',
        border: '1px solid rgba(146,111,25,0.14)',
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
  const { user } = useSelector((state) => state.auth);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [tableOrders, setTableOrders] = useState([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [activeTableOrder, setActiveTableOrder] = useState(null);
  const [selectedParcelOrderId, setSelectedParcelOrderId] = useState('');
  const [activeParcelOrder, setActiveParcelOrder] = useState(null);
  const [parcelCustomerName, setParcelCustomerName] = useState('');
  const [parcelNameDialogOpen, setParcelNameDialogOpen] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [serviceTypeDialogOpen, setServiceTypeDialogOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [lastBillPrintMode, setLastBillPrintMode] = useState('both');

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, tablesRes, billsRes] = await Promise.all([
        API.get('/menu'),
        API.get('/billing/tables'),
        user?.role === 'owner' ? API.get('/billing') : Promise.resolve({ data: [] }),
      ]);
      setMenuItems(menuRes.data);
      setTableOrders(tablesRes.data);
      setBills(billsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => {
    const seen = [];
    menuItems.forEach((item) => {
      if (!seen.includes(item.category)) seen.push(item.category);
    });
    return ['All', ...seen];
  }, [menuItems]);

  const subcategories = useMemo(() => {
    const rules = MENU_SUBCATEGORY_RULES[getMenuSection(activeCategory)];
    if (!rules) return [];
    const available = new Set(
      menuItems
        .filter((item) => item.category === activeCategory)
        .map((item) => getItemSubcategory(activeCategory, item.name))
    );
    return ['All', ...rules.map(([subcategory]) => subcategory).filter((subcategory) => available.has(subcategory))];
  }, [menuItems, activeCategory]);

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSubcategory = subcategories.length === 0 || activeSubcategory === 'All' ||
        getItemSubcategory(activeCategory, item.name) === activeSubcategory;
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [menuItems, activeCategory, activeSubcategory, search, subcategories.length]);

  const orderItems = [...sentItems, ...selectedItems];
  const activeOrder = activeTableOrder || activeParcelOrder;

  const getQuantity = (itemId) => orderItems
    .filter((selected) => selected.menuItem._id === itemId)
    .reduce((quantity, selected) => quantity + selected.quantity, 0);

  const selectTable = (tableNumber) => {
    if (selectedItems.length && !window.confirm('Discard the unsent items before switching tables?')) return;
    const order = tableOrders.find((item) => Number(item.tableNumber) === tableNumber) || null;
    const savedItems = (order?.items || []).filter((item) => !item.isParcelCharge).map((item) => ({
      ...item,
      menuItem: item.menuItem?._id ? item.menuItem : {
        _id: item.menuItem || item.id,
        name: item.name,
        price: Number(item.price),
        gstRate: Number(item.gstRate),
      },
      serviceType: item.serviceType || 'dine-in',
    }));
    setSelectedTableNumber(tableNumber);
    setActiveParcelOrder(null);
    setSelectedParcelOrderId('');
    setParcelCustomerName('');
    setActiveTableOrder(order);
    setSentItems(savedItems);
    setSelectedItems([]);
  };

  const selectWalkIn = () => {
    if (selectedItems.length && !window.confirm('Discard the unsent items and switch to walk-in billing?')) return;
    setSelectedTableNumber(null);
    setActiveTableOrder(null);
    setActiveParcelOrder(null);
    setSelectedParcelOrderId('');
    setParcelCustomerName('');
    setSentItems([]);
    setSelectedItems([]);
  };

  const openParcelOrder = () => {
    if (selectedItems.length && !window.confirm('Discard the unsent items before starting a parcel order?')) return;
    setSelectedTableNumber(null);
    setActiveTableOrder(null);
    setActiveParcelOrder(null);
    setSelectedParcelOrderId('');
    setSentItems([]);
    setSelectedItems([]);
    setParcelCustomerName('');
    setParcelNameDialogOpen(true);
  };

  const startParcelOrder = () => {
    const name = parcelCustomerName.trim();
    if (!name) return;
    setActiveParcelOrder(null);
    setSelectedParcelOrderId('');
    setParcelCustomerName(name);
    setSelectedServiceType('take-away');
    setParcelNameDialogOpen(false);
  };

  const selectParcelOrder = (orderId) => {
    if (selectedItems.length && !window.confirm('Discard unsent items before switching parcel orders?')) return;
    const order = tableOrders.find((item) => item._id === orderId && item.orderType === 'parcel');
    if (!order) {
      setSelectedParcelOrderId('');
      setActiveParcelOrder(null);
      setParcelCustomerName('');
      setSentItems([]);
      setSelectedItems([]);
      return;
    }
    setSelectedTableNumber(null);
    setActiveTableOrder(null);
    setSelectedParcelOrderId(order._id);
    setActiveParcelOrder(order);
    setParcelCustomerName(order.customerName || '');
    setSentItems((order.items || []).filter((item) => !item.isParcelCharge).map((item) => ({
      ...item,
      menuItem: item.menuItem?._id ? item.menuItem : {
        _id: item.menuItem || item.id,
        name: item.name,
        price: Number(item.price),
        gstRate: Number(item.gstRate),
      },
      serviceType: 'take-away',
    })));
    setSelectedItems([]);
  };

  const promptServiceType = (item) => {
    setPendingItem(item);
    setSelectedServiceType(activeParcelOrder || parcelCustomerName ? 'take-away' : 'dine-in');
    setServiceTypeDialogOpen(true);
  };

  const addItemToBill = (item, serviceType) => {
    const selectedType = activeParcelOrder || parcelCustomerName ? 'take-away' : serviceType;
    const existingItem = selectedItems.find((selected) => (
      selected.menuItem._id === item._id && selected.serviceType === selectedType
    ));
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i === existingItem ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        { menuItem: item, quantity: 1, gstRate: item.gstRate, serviceType: selectedType },
      ]);
    }
  };

  const removeItemFromBill = (itemId, serviceType) => {
    setSelectedItems(selectedItems.filter((i) => (
      i.menuItem._id !== itemId || i.serviceType !== serviceType
    )));
  };

  const getTakeawayQuantity = () => orderItems
    .filter((item) => item.serviceType === 'take-away')
    .reduce((quantity, item) => quantity + item.quantity, 0);

  const calculateParcelCharge = () => {
    const quantity = getTakeawayQuantity();
    return quantity === 1 ? 10 : quantity === 2 ? 15 : quantity >= 3 ? 30 : 0;
  };

  const getParcelFeeLabel = (quantity) => (
    quantity <= 0 ? 'No parcel fee'
      : quantity === 1 ? '1 parcel · ₹10'
        : quantity === 2 ? '2 parcels · ₹15'
          : `${quantity} parcels · ₹30`
  );

  const calculateTotal = () => {
    const itemsTotal = orderItems
      .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
    return Number((itemsTotal + calculateParcelCharge()).toFixed(2));
  };

  const cashReceivedAmount = Number(cashReceived);
  const cashIsSufficient = cashReceived !== '' && Number.isFinite(cashReceivedAmount) &&
    Math.round(cashReceivedAmount * 100) >= Math.round(calculateTotal() * 100);
  const changeDue = cashIsSufficient
    ? (Math.round(cashReceivedAmount * 100) - Math.round(calculateTotal() * 100)) / 100
    : 0;

  const calculateGST = () => {
    return orderItems.reduce((sum, item) => {
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

  const handlePrintCustomerBill = async (bill) => {
    setPrintingBillId(bill._id);
    try {
      if (isBluetoothPrintSupported()) await printFullBillToBluetoothPrinter(bill);
      else printCustomerBillReceipt(bill);
    } catch (error) {
      console.error('Customer receipt printing failed:', error);
      alert(`Printing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setPrintingBillId(null);
    }
  };

  const handleSendToKitchen = async () => {
    const orderType = selectedTableNumber != null ? 'table' : activeParcelOrder || parcelCustomerName ? 'parcel' : null;
    if (!orderType || selectedItems.length === 0 || (orderType === 'parcel' && !parcelCustomerName.trim())) return;
    setSendingToKitchen(true);
    try {
      const response = await API.post('/billing/open-orders/send', {
        orderType,
        tableNumber: orderType === 'table' ? selectedTableNumber : null,
        customerName: orderType === 'parcel' ? parcelCustomerName.trim() : null,
        pendingOrderId: orderType === 'parcel' ? selectedParcelOrderId || null : null,
        items: selectedItems.map((item) => ({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
          serviceType: orderType === 'parcel' ? 'take-away' : item.serviceType,
        })),
      });
      const { order, kitchenItems } = response.data;
      if (orderType === 'table') setActiveTableOrder(order);
      else {
        setActiveParcelOrder(order);
        setSelectedParcelOrderId(order._id);
      }
      setSentItems((order.items || []).filter((item) => !item.isParcelCharge).map((item) => ({
        ...item,
        menuItem: item.menuItem?._id ? item.menuItem : {
          _id: item.menuItem || item.id,
          name: item.name,
          price: Number(item.price),
          gstRate: Number(item.gstRate),
        },
      })));
      setSelectedItems([]);
      setTableOrders((current) => [order, ...current.filter((item) => (
        orderType === 'table'
          ? item.orderType !== 'table' || Number(item.tableNumber) !== selectedTableNumber
          : item._id !== order._id
      ))]);
      const ticket = {
        ...order,
        tableNumber: orderType === 'table' ? selectedTableNumber : null,
        customerName: orderType === 'parcel' ? parcelCustomerName.trim() : null,
        items: kitchenItems,
      };
      if (isBluetoothPrintSupported()) await printKitchenTokenToBluetoothPrinter(ticket);
      else printKitchenTokenReceipt(ticket);
      fetchData();
    } catch (error) {
      console.error('Could not send order to kitchen:', error);
      alert(error.response?.data?.error || `Order saved, but kitchen printing failed: ${error.message || 'Unknown error'}`);
      fetchData();
    } finally {
      setSendingToKitchen(false);
    }
  };

  const handleCreateBill = async () => {
    if (paymentMethod === 'Cash' && !cashIsSufficient) return;
    try {
      const billData = {
        items: selectedItems.map((item) => ({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
          serviceType: item.serviceType,
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' ? cashReceivedAmount : null,
      };

      const response = activeOrder
        ? await API.put(`/billing/${activeOrder._id}/complete`, {
          paymentMethod,
          cashReceived: paymentMethod === 'Cash' ? cashReceivedAmount : null,
        })
        : await API.post('/billing', billData);
      setLastBillPrintMode(activeOrder ? 'customer' : 'both');
      setSelectedItems([]);
      setSentItems([]);
      setSelectedTableNumber(null);
      setActiveTableOrder(null);
      setActiveParcelOrder(null);
      setSelectedParcelOrderId('');
      setParcelCustomerName('');
      if (activeOrder) {
        setTableOrders((current) => current.filter((item) => item._id !== response.data._id));
      }
      setPaymentMethod('Cash');
      setCashReceived('');
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

      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#503622', fontWeight: 700 }}>Select table</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={selectWalkIn} variant={selectedTableNumber == null && !activeParcelOrder && !parcelCustomerName ? 'contained' : 'text'}>
              Walk-in
            </Button>
            <Button
              size="small"
              onClick={openParcelOrder}
              variant={activeParcelOrder || parcelCustomerName ? 'contained' : 'outlined'}
            >
              Parcel order
            </Button>
          </Stack>
        </Box>
        <ToggleButtonGroup
          exclusive
          value={selectedTableNumber}
          onChange={(event, value) => { if (value != null) selectTable(value); }}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButtonGroup-grouped': { border: '1px solid #ddd !important', borderRadius: '8px !important', m: 0 } }}
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((tableNumber) => {
            const isOpen = tableOrders.some((order) => Number(order.tableNumber) === tableNumber);
            return (
              <ToggleButton
                key={tableNumber}
                value={tableNumber}
                aria-label={`Table ${tableNumber}${isOpen ? ', open order' : ', available'}`}
                sx={{ minWidth: 56, minHeight: 44, px: 1, fontWeight: 700, textTransform: 'none' }}
              >
                T{tableNumber}{isOpen ? ' •' : ''}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        {tableOrders.some((order) => order.orderType === 'parcel') && (
          <FormControl size="small" sx={{ minWidth: 260, mt: 1 }}>
            <InputLabel>Open parcel orders</InputLabel>
            <Select
              value={selectedParcelOrderId}
              label="Open parcel orders"
              onChange={(event) => selectParcelOrder(event.target.value)}
            >
              <MenuItem value=""><em>Select customer parcel order</em></MenuItem>
              {tableOrders.filter((order) => order.orderType === 'parcel').map((order) => (
                <MenuItem key={order._id} value={order._id}>
                  {order.customerName} · {getBillTokenNumber(order)} · ₹{Number(order.total).toFixed(2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {parcelCustomerName && !activeParcelOrder && selectedTableNumber == null && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
            New parcel order for {parcelCustomerName}
          </Typography>
        )}
        {selectedTableNumber != null && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.75 }}>
            {activeTableOrder
              ? `Table ${selectedTableNumber} has an open order. New items print to the kitchen when sent.`
              : `Table ${selectedTableNumber} is selected. Send items to the kitchen to open its order.`}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Menu Selection */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(111, 78, 55, 0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Select Items</Typography>
                <Tooltip title={searchOpen ? 'Close search' : 'Search dishes'}>
                  <IconButton
                    size="small"
                    aria-label={searchOpen ? 'Close dish search' : 'Search dishes'}
                    onClick={() => {
                      setSearchOpen((open) => !open);
                      setSearch('');
                    }}
                  >
                    {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              {searchOpen && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search dishes…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoComplete="off"
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#a08670' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Tabs
                value={activeCategory}
                onChange={(event, value) => {
                  setActiveCategory(value);
                  setActiveSubcategory('All');
                }}
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
                    color: '#806112',
                  },
                  '& .Mui-selected': {
                    bgcolor: '#9b7015',
                    color: '#fff !important',
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                {categories.map((category) => (
                  <Tab key={category} value={category} label={getCategoryLabel(category)} />
                ))}
              </Tabs>

              {subcategories.length > 0 && (
                <Tabs
                  value={activeSubcategory}
                  onChange={(event, value) => setActiveSubcategory(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  aria-label="Morning item groups"
                  sx={{
                    mb: 2,
                    minHeight: 32,
                    '& .MuiTab-root': {
                      minHeight: 32,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#806112',
                    },
                    '& .Mui-selected': { color: '#806112' },
                    '& .MuiTabs-indicator': { backgroundColor: '#c59a32', height: 3 },
                  }}
                >
                  {subcategories.map((subcategory) => (
                    <Tab key={subcategory} value={subcategory} label={subcategory} />
                  ))}
                </Tabs>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(4, minmax(0, 1fr))',
                    sm: 'repeat(5, minmax(0, 1fr))',
                    lg: 'repeat(6, minmax(0, 1fr))',
                    xl: 'repeat(7, minmax(0, 1fr))',
                  },
                  gap: 0.75,
                }}
              >
                {visibleItems.map((item) => {
                  const quantity = getQuantity(item._id);
                  return (
                    <Button
                      key={item._id}
                      fullWidth
                      variant="outlined"
                      onClick={() => promptServiceType(item)}
                      aria-label={`Add ${item.name}, ₹${Number(item.price).toFixed(2)}, choose dine in or take away`}
                      sx={{
                        position: 'relative',
                        minWidth: 0,
                        minHeight: 78,
                        px: 0.5,
                        py: 0.75,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 0.4,
                        textTransform: 'none',
                        borderColor: quantity > 0 ? '#c59a32' : 'rgba(146,111,25,0.16)',
                        bgcolor: quantity > 0 ? '#fff5d6' : '#fffdf4',
                        '&:hover': { borderColor: '#c59a32', bgcolor: '#fff5d6' },
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <MenuItemPhoto item={item} />
                        {quantity > 0 && (
                          <Chip size="small" label={quantity} sx={{
                            position: 'absolute', top: -6, right: -7, minWidth: 19, height: 19,
                            bgcolor: '#68462f', color: '#fff', fontWeight: 700,
                            '& .MuiChip-label': { px: 0.5 },
                          }} />
                        )}
                      </Box>
                      <Typography sx={{
                        width: '100%', fontSize: '0.69rem', lineHeight: 1.15, minHeight: 25,
                        color: '#3b3027', fontWeight: 700, textAlign: 'center',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#68462f', fontSize: '0.68rem', fontWeight: 700 }}>
                        ₹{Number(item.price).toFixed(0)}
                      </Typography>
                    </Button>
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
                {selectedTableNumber != null
                  ? `Table ${selectedTableNumber} Order`
                  : activeParcelOrder || parcelCustomerName
                    ? `Parcel Order · ${parcelCustomerName}`
                    : 'Bill Summary'}
              </Typography>

              {orderItems.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {selectedTableNumber != null ? 'Add items, then send them to the kitchen.' : 'Tap a dish to start a bill.'}
                  </Typography>
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
                      {orderItems.map((item) => {
                        const isDraft = selectedItems.includes(item);
                        const itemTotal = item.menuItem.price * item.quantity;
                        return (
                          <TableRow key={`${item.menuItem._id}-${item.serviceType}-${isDraft ? 'draft' : 'sent'}`}>
                            <TableCell>
                              {item.menuItem.name}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {item.serviceType === 'take-away' ? 'Take away · +₹10' : 'Dine in'}
                                {selectedTableNumber != null && ` · ${isDraft ? 'Not sent' : 'Kitchen sent'}`}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{itemTotal.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              {isDraft && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Remove ${item.menuItem.name}`}
                                  onClick={() => removeItemFromBill(item.menuItem._id, item.serviceType)}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              )}
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
                    {orderItems
                      .reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
                      .toFixed(2)}
                  </Typography>
                </Box>
                {calculateParcelCharge() > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Delivery fee · {getParcelFeeLabel(getTakeawayQuantity())}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>₹{calculateParcelCharge().toFixed(2)}</Typography>
                  </Box>
                )}
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
                disabled={selectedTableNumber != null
                  ? (selectedItems.length > 0 ? sendingToKitchen : !activeTableOrder)
                  : (activeParcelOrder || parcelCustomerName)
                    ? (selectedItems.length > 0 ? sendingToKitchen : !activeParcelOrder)
                  : selectedItems.length === 0}
                onClick={() => {
                  if ((selectedTableNumber != null || activeParcelOrder || parcelCustomerName) && selectedItems.length > 0) handleSendToKitchen();
                  else setOpenDialog(true);
                }}
              >
                {selectedTableNumber != null
                  ? selectedItems.length > 0
                    ? (sendingToKitchen ? 'Sending to kitchen…' : 'Send to kitchen')
                    : 'Take payment'
                  : (activeParcelOrder || parcelCustomerName)
                    ? selectedItems.length > 0
                      ? (sendingToKitchen ? 'Sending parcel to kitchen…' : 'Send parcel to kitchen')
                      : 'Take parcel payment'
                    : 'Complete Billing'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={serviceTypeDialogOpen}
        onClose={() => setServiceTypeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{pendingItem ? `How is ${pendingItem.name} served?` : 'Choose service type'}</DialogTitle>
        <DialogContent>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={selectedServiceType}
            onChange={(event, value) => value && setSelectedServiceType(value)}
            sx={{ mt: 1 }}
          >
            {activeParcelOrder || parcelCustomerName ? (
              <ToggleButton value="take-away" disabled>Parcel · Take away</ToggleButton>
            ) : (
              <>
                <ToggleButton value="dine-in">Dine in</ToggleButton>
                <ToggleButton value="take-away">Take away</ToggleButton>
              </>
            )}
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button fullWidth variant="outlined" onClick={() => setServiceTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                if (pendingItem) addItemToBill(pendingItem, selectedServiceType);
                setServiceTypeDialogOpen(false);
                setPendingItem(null);
              }}
              sx={{ bgcolor: '#6f4e37' }}
            >
              Add item
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={parcelNameDialogOpen}
        onClose={() => {
          setParcelNameDialogOpen(false);
          if (!activeParcelOrder) setParcelCustomerName('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>New parcel order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Enter the customer name. Every item in this order will be marked take away.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            required
            label="Customer name"
            value={parcelCustomerName}
            onChange={(event) => setParcelCustomerName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') startParcelOrder(); }}
            inputProps={{ maxLength: 120 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Delivery fee: {getParcelFeeLabel(getTakeawayQuantity())} · updates with parcel quantity
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setParcelNameDialogOpen(false);
                if (!activeParcelOrder) setParcelCustomerName('');
              }}
            >
              Cancel
            </Button>
            <Button fullWidth variant="contained" onClick={startParcelOrder} disabled={!parcelCustomerName.trim()} sx={{ bgcolor: '#68462f' }}>
              Start parcel order
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

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

            {paymentMethod === 'Cash' && (
              <>
                <TextField
                  fullWidth
                  required
                  autoFocus
                  type="number"
                  label="Cash received"
                  value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                  inputProps={{ min: calculateTotal(), step: '0.01', inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                {cashReceived !== '' && (
                  <Typography
                    role="status"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      color: cashIsSufficient ? '#287a48' : '#b33b31',
                    }}
                  >
                    {cashIsSufficient
                      ? `Change to return: ₹${changeDue.toFixed(2)}`
                      : `Amount due: ₹${(calculateTotal() - cashReceivedAmount).toFixed(2)}`}
                  </Typography>
                )}
              </>
            )}

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
                disabled={paymentMethod === 'Cash' && !cashIsSufficient}
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
                      onClick={() => (bill.tableNumber ? handlePrintCustomerBill(bill) : handlePrintBoth(bill))}
                      disabled={printingBillId === bill._id}
                      title={bill.tableNumber ? 'Print customer receipt only' : 'Print customer and kitchen receipts'}
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
        message={lastBill
          ? `${lastBill.tableNumber ? `Table ${lastBill.tableNumber} paid · ` : ''}Bill ${getCompactBillNumber(lastBill.billNumber)} / Token ${getBillTokenNumber(lastBill)} created`
          : ''}
        action={
          lastBill ? (
            <Button
              size="small"
              startIcon={<ReceiptLongIcon fontSize="small" />}
              sx={{ color: '#90caf9' }}
              disabled={printingBillId === lastBill._id}
              onClick={() => (lastBillPrintMode === 'customer'
                ? handlePrintCustomerBill(lastBill)
                : handlePrintBoth(lastBill))}
            >
              {lastBillPrintMode === 'customer' ? 'Print customer bill' : 'Print both receipts'}
            </Button>
          ) : null
        }
      />
    </Container>
  );
};

export default Billing;
