const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const timeZone = 'Asia/Kolkata';
const pageSize = 500;

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can access food analysis' });
  return false;
};

const indiaDateKey = date => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const shiftDate = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getPeriodStart = (period, today) => {
  if (period === 'daily') return today;
  if (period === 'weekly') {
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
    return shiftDate(today, -((dayOfWeek + 6) % 7));
  }
  if (period === 'monthly') return `${today.slice(0, 7)}-01`;
  return null;
};

const fetchBills = async (startDate, endDate) => {
  const bills = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from('mc_bills')
      .select('created_at, items')
      .eq('status', 'Completed')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (startDate) query = query.gte('created_at', startDate);
    query = query.lte('created_at', endDate);
    const { data, error } = await query;
    if (error) throw error;
    bills.push(...data);
    if (data.length < pageSize) return bills;
  }
};

const buildTrend = (period, bills, startDate, today) => {
  const values = new Map();
  let labels = [];

  if (period === 'daily') {
    labels = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  } else if (period === 'weekly') {
    labels = Array.from({ length: 7 }, (_, day) => shiftDate(startDate, day));
  } else if (period === 'monthly') {
    const monthEnd = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    const dayCount = Math.round((monthEnd.getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000);
    labels = Array.from({ length: dayCount }, (_, day) => shiftDate(startDate, day));
  } else {
    labels = [...new Set(bills.map(bill => indiaDateKey(new Date(bill.created_at)).slice(0, 7)))].sort();
  }

  const labelForBill = bill => {
    const date = new Date(bill.created_at);
    if (period === 'daily') {
      return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' })
        .format(date);
    }
    const dateKey = indiaDateKey(date);
    return period === 'lifetime' ? dateKey.slice(0, 7) : dateKey;
  };

  labels.forEach(label => values.set(label, 0));
  bills.forEach(bill => {
    const bucket = labelForBill(bill);
    const units = (bill.items || [])
      .filter(item => !item.isParcelCharge)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (values.has(bucket)) values.set(bucket, values.get(bucket) + units);
  });

  const formatLabel = label => {
    if (period === 'daily') return `${label}:00`;
    if (period === 'lifetime') {
      const [year, month] = label.split('-').map(Number);
      return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone })
        .format(new Date(Date.UTC(year, month - 1, 1)));
    }
    const date = new Date(`${label}T12:00:00+05:30`);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone,
      ...(period === 'weekly' ? { weekday: 'short' } : { day: 'numeric', month: 'short' })
    }).format(date);
  };

  return {
    labels: labels.map(formatLabel),
    units: labels.map(label => values.get(label) || 0)
  };
};

router.get('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const period = req.query.period || 'daily';
  if (!['daily', 'weekly', 'monthly', 'lifetime'].includes(period)) {
    return res.status(400).json({ error: 'Period must be daily, weekly, monthly, or lifetime' });
  }

  try {
    const now = new Date();
    const today = indiaDateKey(now);
    const startDate = getPeriodStart(period, today);
    const startTimestamp = startDate ? new Date(`${startDate}T00:00:00+05:30`).toISOString() : null;
    const [bills, menuResult] = await Promise.all([
      fetchBills(startTimestamp, now.toISOString()),
      supabase.from('mc_menu_items').select('id, name, category, active').eq('active', true).order('name')
    ]);
    if (menuResult.error) throw menuResult.error;

    const menuById = new Map(menuResult.data.map(item => [item.id, item]));
    const sales = new Map();
    let grossSales = 0;
    bills.forEach(bill => {
      (bill.items || []).forEach(item => {
        if (item.isParcelCharge) return;
        const quantity = Number(item.quantity || 0);
        const menuItem = menuById.get(item.menuItem);
        const key = item.menuItem || `${item.category || ''}:${String(item.name || '').toLowerCase()}`;
        const row = sales.get(key) || {
          id: item.menuItem || key,
          name: menuItem?.name || item.name || 'Unknown item',
          category: menuItem?.category || item.category || 'Other',
          quantity: 0,
          revenue: 0,
          active: menuItem?.active ?? false
        };
        row.quantity += quantity;
        row.revenue += Number(item.totalAmount || Number(item.price || 0) * quantity);
        grossSales += Number(item.totalAmount || Number(item.price || 0) * quantity);
        sales.set(key, row);
      });
    });

    const soldItems = [...sales.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
    const soldIds = new Set(soldItems.map(item => item.id));
    const unsoldItems = menuResult.data
      .filter(item => !soldIds.has(item.id))
      .map(item => ({ id: item.id, name: item.name, category: item.category, quantity: 0, revenue: 0, active: true }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    const activeSoldCount = soldItems.filter(item => item.active).length;

    res.json({
      period,
      startDate,
      endDate: now.toISOString(),
      billsCount: bills.length,
      unitsSold: soldItems.reduce((sum, item) => sum + item.quantity, 0),
      grossSales: Number(grossSales.toFixed(2)),
      activeMenuItems: menuResult.data.length,
      activeSoldItems: activeSoldCount,
      soldItems,
      unsoldItems,
      trend: buildTrend(period, bills, startDate, today)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;