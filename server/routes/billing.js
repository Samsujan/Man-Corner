const express = require('express');
const { randomBytes } = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const paymentMethods = ['Cash', 'Card', 'UPI', 'Online'];
const parcelChargePerItem = 10;

const getLegacyTokenNumber = (billNumber = '') => {
  const digits = String(billNumber).replace(/\D/g, '');
  return digits ? digits.slice(-4).padStart(4, '0') : null;
};

const applyDateFilter = (query, column, startDate, endDate) => {
  if (startDate) query = query.gte(column, new Date(startDate).toISOString());
  if (endDate) {
    const end = new Date(endDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);
    query = query.lte(column, end.toISOString());
  }
  return query;
};

const expandBill = (bill, usersById, menuById) => ({
  ...bill,
  _id: bill.id,
  billNumber: bill.bill_number,
  tokenNumber: bill.token_number == null
    ? getLegacyTokenNumber(bill.bill_number)
    : String(bill.token_number).padStart(2, '0'),
  tokenDate: bill.token_date,
  createdAt: bill.created_at,
  paymentMethod: bill.payment_method,
  cashReceived: bill.cash_received == null ? null : Number(bill.cash_received),
  changeDue: bill.change_due == null ? null : Number(bill.change_due),
  subtotal: Number(bill.subtotal),
  totalGST: Number(bill.total_gst),
  parcelCharge: (bill.items || [])
    .filter(item => item.isParcelCharge)
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
  total: Number(bill.total),
  createdBy: usersById[bill.created_by] || null,
  items: (bill.items || []).map(item => ({
    ...item,
    price: Number(item.price),
    gstRate: Number(item.gstRate),
    gstAmount: Number(item.gstAmount),
    totalAmount: Number(item.totalAmount),
    menuItem: item.menuItem ? {
      ...(menuById[item.menuItem] || {}),
      _id: item.menuItem,
      name: item.name || menuById[item.menuItem]?.name,
      price: Number(item.price),
      gstRate: Number(item.gstRate)
    } : null
  }))
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod = 'Cash', cashReceived } = req.body;
    if (!Array.isArray(items) || items.length === 0 ||
        !paymentMethods.includes(paymentMethod) ||
        items.some(item => !item || typeof item.menuItemId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.menuItemId) ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1 || Number(item.quantity) > 99 ||
          (item.serviceType !== undefined && !['dine-in', 'take-away'].includes(item.serviceType)))) {
      return res.status(400).json({ error: 'Provide valid bill items and a supported payment method' });
    }

    const menuItemIds = [...new Set(items.map(item => item.menuItemId))];
    const { data: menuItems, error: menuError } = await supabase
      .from('mc_menu_items')
      .select('id, name, price, gst_rate, active')
      .in('id', menuItemIds);
    if (menuError) throw menuError;
    const menuById = Object.fromEntries(menuItems.map(item => [item.id, item]));
    if (menuItems.length !== menuItemIds.length || menuItems.some(item => !item.active)) {
      return res.status(400).json({ error: 'One or more menu items are unavailable' });
    }

    const billItems = items.map(item => {
      const menuItem = menuById[item.menuItemId];
      const quantity = Number(item.quantity);
      const serviceType = item.serviceType || 'dine-in';
      const price = Number(menuItem.price);
      const gstRate = Number(menuItem.gst_rate);
      const totalAmount = Number((price * quantity).toFixed(2));
      const gstAmount = Number((totalAmount * gstRate / (100 + gstRate)).toFixed(2));
      return {
        menuItem: menuItem.id,
        name: menuItem.name,
        quantity,
        price,
        gstRate,
        gstAmount,
        totalAmount,
        serviceType,
        gstIncluded: true
      };
    });
    const parcelQuantity = billItems
      .filter(item => item.serviceType === 'take-away')
      .reduce((sum, item) => sum + item.quantity, 0);
    const totalParcelCharge = Number((parcelQuantity * parcelChargePerItem).toFixed(2));
    if (parcelQuantity > 0) {
      billItems.push({
        name: 'Parcel charge',
        quantity: parcelQuantity,
        price: parcelChargePerItem,
        gstRate: 0,
        gstAmount: 0,
        totalAmount: totalParcelCharge,
        gstIncluded: false,
        isParcelCharge: true
      });
    }
    const subtotal = Number(billItems
      .filter(item => !item.isParcelCharge)
      .reduce((sum, item) => sum + item.totalAmount - item.gstAmount, 0)
      .toFixed(2));
    const totalGST = Number(billItems.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2));
    const total = Number((subtotal + totalGST + totalParcelCharge).toFixed(2));
    const cashReceivedAmount = paymentMethod === 'Cash' ? Number(cashReceived) : null;
    if (paymentMethod === 'Cash' &&
        (!Number.isFinite(cashReceivedAmount) ||
          Math.round(cashReceivedAmount * 100) < Math.round(total * 100))) {
      return res.status(400).json({ error: 'Cash received must be at least the bill total' });
    }
    const changeDue = paymentMethod === 'Cash'
      ? Number(((Math.round(cashReceivedAmount * 100) - Math.round(total * 100)) / 100).toFixed(2))
      : null;
    const billNumber = `MAN-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const { data, error } = await supabase
      .from('mc_bills')
      .insert({
        bill_number: billNumber,
        created_by: req.user.id,
        items: billItems,
        subtotal,
        total_gst: totalGST,
        total,
        cash_received: cashReceivedAmount,
        change_due: changeDue,
        payment_method: paymentMethod,
        status: 'Completed'
      })
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json(expandBill(data, {
      [req.user.id]: { id: req.user.id, _id: req.user.id, name: req.user.name }
    }, Object.fromEntries(menuItems.map(item => [item.id, {
      ...item,
      _id: item.id,
      gstRate: item.gst_rate
    }]))));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
      return res.status(400).json({ error: 'Date filters must be valid dates' });
    }
    if (start && end && start > end) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);
    let query = supabase.from('mc_bills').select('*');
    query = applyDateFilter(
      query,
      'created_at',
      start && start.toISOString(),
      end && end.toISOString()
    );
    const { data: bills, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const creatorIds = [...new Set(bills.map(bill => bill.created_by).filter(Boolean))];
    const menuItemIds = [...new Set(bills.flatMap(bill => (bill.items || [])
      .filter(item => item.menuItem && !item.isParcelCharge)
      .map(item => item.menuItem)))];
    const [usersResult, menuResult] = await Promise.all([
      creatorIds.length
        ? supabase.from('mc_users').select('id, name').in('id', creatorIds)
        : Promise.resolve({ data: [], error: null }),
      menuItemIds.length
        ? supabase.from('mc_menu_items').select('id, name, category, price, gst_rate').in('id', menuItemIds)
        : Promise.resolve({ data: [], error: null })
    ]);
    if (usersResult.error) throw usersResult.error;
    if (menuResult.error) throw menuResult.error;
    const usersById = Object.fromEntries(usersResult.data.map(user => [user.id, { ...user, _id: user.id }]));
    const menuById = Object.fromEntries(menuResult.data.map(item => [item.id, {
      ...item,
      _id: item.id,
      gstRate: item.gst_rate
    }]));
    res.json(bills.map(bill => expandBill(bill, usersById, menuById)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: bill, error } = await supabase
      .from('mc_bills')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const [{ data: creator, error: creatorError }, { data: menuItems, error: menuError }] = await Promise.all([
      bill.created_by
        ? supabase.from('mc_users').select('id, name').eq('id', bill.created_by).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      (bill.items || []).some(item => item.menuItem && !item.isParcelCharge)
        ? supabase.from('mc_menu_items').select('id, name, category, price, gst_rate')
          .in('id', (bill.items || []).filter(item => item.menuItem && !item.isParcelCharge).map(item => item.menuItem))
        : Promise.resolve({ data: [], error: null })
    ]);
    if (creatorError) throw creatorError;
    if (menuError) throw menuError;
    res.json(expandBill(bill, creator ? {
      [bill.created_by]: { ...creator, _id: creator.id }
    } : {}, Object.fromEntries(menuItems.map(item => [item.id, {
      ...item,
      _id: item.id,
      gstRate: item.gst_rate
    }]))));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
