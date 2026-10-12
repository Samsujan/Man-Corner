const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const { estimateIngredients } = require('../lib/groceryRules');
const router = express.Router();

const pageSize = 500;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const round2 = value => Number(Number(value).toFixed(2));

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can access reports' });
  return false;
};

const validDate = value => typeof value === 'string' && datePattern.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());

const shiftDate = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const todayInIndia = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const fetchBills = async (startDate, endDate, status) => {
  const bills = [];
  const start = new Date(`${startDate}T00:00:00+05:30`).toISOString();
  const end = new Date(`${shiftDate(endDate, 1)}T00:00:00+05:30`).toISOString();
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('mc_bills').select('*')
      .eq('status', status).gte('created_at', start).lt('created_at', end)
      .order('created_at').range(offset, offset + pageSize - 1);
    if (error) throw error;
    bills.push(...data);
    if (data.length < pageSize) return bills;
  }
};

const foodLines = bill => (bill.items || []).filter(item => !item.isParcelCharge);
const parcelOf = bill => (bill.items || []).filter(item => item.isParcelCharge)
  .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

router.get('/daily-sales', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const date = req.query.date || todayInIndia();
  if (!validDate(date)) return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required' });

  try {
    const [bills, cancelled] = await Promise.all([
      fetchBills(date, date, 'Completed'),
      fetchBills(date, date, 'Cancelled')
    ]);
    const byPayment = {};
    const byItem = new Map();
    let parcelCharges = 0;
    let gst = 0;
    let total = 0;
    for (const bill of bills) {
      const parcel = parcelOf(bill);
      parcelCharges += parcel;
      gst += Number(bill.total_gst);
      total += Number(bill.total);
      byPayment[bill.payment_method] = round2((byPayment[bill.payment_method] || 0) + Number(bill.total));
      for (const item of foodLines(bill)) {
        const key = `${item.name}|${item.serviceType || 'dine-in'}`;
        const row = byItem.get(key) || { name: item.name, serviceType: item.serviceType || 'dine-in', quantity: 0, amount: 0 };
        row.quantity += Number(item.quantity);
        row.amount = round2(row.amount + Number(item.totalAmount));
        byItem.set(key, row);
      }
    }
    res.json({
      date,
      billCount: bills.length,
      cancelledCount: cancelled.length,
      foodSales: round2(total - parcelCharges),
      parcelCharges: round2(parcelCharges),
      gst: round2(gst),
      totalRevenue: round2(total),
      byPayment,
      items: [...byItem.values()].sort((a, b) => b.quantity - a.quantity),
      bills: bills.map(bill => ({
        id: bill.id,
        billNumber: bill.bill_number,
        tokenNumber: bill.token_number == null ? null : String(bill.token_number).padStart(2, '0'),
        createdAt: bill.created_at,
        tableNumber: bill.table_number ?? null,
        orderType: bill.table_number ? 'table' : (bill.order_type || 'walk-in'),
        customerName: bill.customer_name || null,
        paymentMethod: bill.payment_method,
        parcelCharge: round2(parcelOf(bill)),
        total: round2(bill.total)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/grocery-requirements', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const endDate = req.query.endDate || todayInIndia();
  const days = Number(req.query.days || 7);
  const buffer = Number(req.query.bufferPercent || 10);
  if (!validDate(endDate) || !Number.isInteger(days) || days < 1 || days > 31 ||
      !Number.isFinite(buffer) || buffer < 0 || buffer > 100) {
    return res.status(400).json({ error: 'Valid endDate, days (1-31) and bufferPercent (0-100) are required' });
  }
  const startDate = shiftDate(endDate, -(days - 1));

  try {
    const bills = await fetchBills(startDate, endDate, 'Completed');
    const sold = new Map();
    for (const bill of bills) {
      for (const item of foodLines(bill)) {
        const row = sold.get(item.name) || { name: item.name, quantity: 0, amount: 0 };
        row.quantity += Number(item.quantity);
        row.amount = round2(row.amount + Number(item.totalAmount));
        sold.set(item.name, row);
      }
    }

    const needs = new Map();
    const unmatched = [];
    for (const row of sold.values()) {
      const use = estimateIngredients(row.name);
      if (!use.length) unmatched.push(row.name);
      for (const [name, perPortion, unit] of use) {
        const key = `${name}|${unit}`;
        const entry = needs.get(key) || { name, unit, required: 0, usedBy: [] };
        entry.required += perPortion * row.quantity;
        entry.usedBy.push(`${row.name} x${row.quantity}`);
        needs.set(key, entry);
      }
    }

    res.json({
      startDate,
      endDate,
      bufferPercent: buffer,
      billCount: bills.length,
      itemsSold: [...sold.values()].sort((a, b) => b.quantity - a.quantity),
      groceries: [...needs.values()].map(entry => ({
        ...entry,
        required: round2(entry.required * 1000) / 1000,
        toBuy: Math.ceil(entry.required * (1 + buffer / 100) * 10) / 10
      })).sort((a, b) => a.unit.localeCompare(b.unit) || a.name.localeCompare(b.name)),
      unmatched
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
