const express = require('express');
const { randomBytes } = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const paymentMethods = ['Cash', 'Card', 'UPI', 'Online'];

const getTokenNumber = (billNumber = '') => {
  const digits = String(billNumber).replace(/\D/g, '');
  if (!digits) return '0000';
  return digits.slice(-4).padStart(4, '0');
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
  tokenNumber: getTokenNumber(bill.bill_number),
  createdAt: bill.created_at,
  paymentMethod: bill.payment_method,
  subtotal: Number(bill.subtotal),
  totalGST: Number(bill.total_gst),
  total: Number(bill.total),
  createdBy: usersById[bill.created_by] || null,
  items: (bill.items || []).map(item => ({
    ...item,
    price: Number(item.price),
    gstRate: Number(item.gstRate),
    gstAmount: Number(item.gstAmount),
    totalAmount: Number(item.totalAmount),
    menuItem: {
      ...(menuById[item.menuItem] || {}),
      _id: item.menuItem,
      name: item.name || menuById[item.menuItem]?.name,
      price: Number(item.price),
      gstRate: Number(item.gstRate)
    }
  }))
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod = 'Cash' } = req.body;
    if (!Array.isArray(items) || items.length === 0 ||
        !paymentMethods.includes(paymentMethod) ||
        items.some(item => !item || typeof item.menuItemId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.menuItemId) ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1 || Number(item.quantity) > 99)) {
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
        gstIncluded: true
      };
    });
    const subtotal = Number(billItems.reduce((sum, item) => sum + item.totalAmount - item.gstAmount, 0).toFixed(2));
    const totalGST = Number(billItems.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2));
    const total = Number((subtotal + totalGST).toFixed(2));
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
    const menuItemIds = [...new Set(bills.flatMap(bill => (bill.items || []).map(item => item.menuItem)))];
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
      supabase.from('mc_menu_items').select('id, name, category, price, gst_rate')
        .in('id', (bill.items || []).map(item => item.menuItem))
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
