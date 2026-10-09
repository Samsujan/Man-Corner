const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const expensesStartDate = '2026-10-03T00:00:00.000Z';

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can access analytics' });
  return false;
};

const fetchRows = async (table, dateColumn, startDate, endDate, limit, minimumDate) => {
  let query = supabase.from(table).select('*');
  if (table === 'mc_bills') query = query.eq('status', 'Completed');
  if (table === 'mc_expenses') query = query.eq('entry_type', 'expense');
  if (startDate || minimumDate) {
    const lowerBound = startDate && minimumDate
      ? (startDate > minimumDate ? startDate : minimumDate)
      : startDate || minimumDate;
    query = query.gte(dateColumn, lowerBound);
  }
  if (endDate) query = query.lte(dateColumn, endDate);
  if (limit) query = query.order(dateColumn, { ascending: false }).limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const parseDateBounds = (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
    res.status(400).json({ error: 'Date filters must be valid dates' });
    return null;
  }
  if (end && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);
  return {
    startDate: start && start.toISOString(),
    endDate: end && end.toISOString()
  };
};

router.get('/revenue', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const bounds = parseDateBounds(req, res);
  if (!bounds) return;

  try {
    const bills = await fetchRows('mc_bills', 'created_at', bounds.startDate, bounds.endDate);
    const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.total), 0);
    const totalGST = bills.reduce((sum, bill) => sum + Number(bill.total_gst), 0);
    res.json({
      totalRevenue,
      totalGST,
      netRevenue: totalRevenue - totalGST,
      billCount: bills.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/expenses-summary', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const bounds = parseDateBounds(req, res);
  if (!bounds) return;

  try {
    const expenses = await fetchRows('mc_expenses', 'date', bounds.startDate, bounds.endDate, null, expensesStartDate);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const byCategory = {};
    expenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + Number(expense.amount);
    });
    res.json({ totalExpenses, byCategory, expenseCount: expenses.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profit-loss', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const bounds = parseDateBounds(req, res);
  if (!bounds) return;

  try {
    const [bills, expenses] = await Promise.all([
      fetchRows('mc_bills', 'created_at', bounds.startDate, bounds.endDate),
      fetchRows('mc_expenses', 'date', bounds.startDate, bounds.endDate, null, expensesStartDate)
    ]);
    const revenue = bills.reduce((sum, bill) => sum + Number(bill.total) - Number(bill.total_gst), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const profit = revenue - totalExpenses;
    const totalGST = bills.reduce((sum, bill) => sum + Number(bill.total_gst), 0);
    res.json({
      revenue,
      totalExpenses,
      profit,
      profitMargin: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0,
      totalGST
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recommendations', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const expenses = await fetchRows('mc_expenses', 'date', null, null, 100, expensesStartDate);
    const byCategory = {};
    expenses.forEach(expense => {
      byCategory[expense.category] = byCategory[expense.category] || { total: 0, count: 0 };
      byCategory[expense.category].total += Number(expense.amount);
      byCategory[expense.category].count += 1;
    });
    const recommendations = [];

    Object.entries(byCategory).forEach(([category, data]) => {
      const average = data.total / data.count;
      if (category === 'Inventory' && average > 10000) {
        recommendations.push({
          priority: 'HIGH',
          category,
          suggestion: 'Review supplier contracts and negotiate better rates',
          potentialSavings: `₹${(average * 0.15).toFixed(2)}`
        });
      }
      if (category === 'Utilities' && average > 5000) {
        recommendations.push({
          priority: 'MEDIUM',
          category,
          suggestion: 'Consider energy-efficient upgrades and monitor usage patterns',
          potentialSavings: `₹${(average * 0.2).toFixed(2)}`
        });
      }
    });
    res.json({
      recommendations: recommendations.length > 0 ? recommendations : [{
        priority: 'MEDIUM',
        category: 'General',
        suggestion: 'Monitor expense trends monthly for cost optimization opportunities',
        potentialSavings: 'Variable'
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/forecast', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const expenses = await fetchRows(
      'mc_expenses',
      'date',
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      null,
      10000,
      expensesStartDate
    );
    const byMonth = {};
    expenses.forEach(expense => {
      const month = expense.date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + Number(expense.amount);
    });
    const values = Object.keys(byMonth).sort().map(month => byMonth[month]);
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
    const baseline = values[0] || 0;
    const trend = values.length > 1 && baseline > 0
      ? ((values[values.length - 1] - baseline) / baseline) * 100
      : 0;

    res.json({
      historicalAverage: Number(average.toFixed(2)),
      trendPercentage: Number(trend.toFixed(2)),
      forecastedMonthlyExpense: Number((average * (1 + trend / 100)).toFixed(2)),
      message: trend > 0 ? '⚠️ Expenses are rising' : '✅ Expenses are stable/declining'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/budget-plan', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const now = new Date();
    const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
    const expenses = await fetchRows('mc_expenses', 'date', lastMonth.toISOString(), now.toISOString(), null, expensesStartDate);
    const lastMonthTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const recommendedBuffer = lastMonthTotal * 0.2;
    res.json({
      lastMonthActual: Number(lastMonthTotal.toFixed(2)),
      recommendedMonthlyBudget: Number((lastMonthTotal + recommendedBuffer).toFixed(2)),
      safetyBuffer: Number(recommendedBuffer.toFixed(2)),
      quarterlyBudgetForecast: Number(((lastMonthTotal + recommendedBuffer) * 3).toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profit-share/:month', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const { month } = req.params;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: 'Month must use YYYY-MM format' });
  }

  try {
    const [year, monthNumber] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, monthNumber, 1) - 1).toISOString();
    const [bills, expenses] = await Promise.all([
      fetchRows('mc_bills', 'created_at', startDate, endDate),
      fetchRows('mc_expenses', 'date', startDate, endDate, null, expensesStartDate)
    ]);
    const revenue = bills.reduce((sum, bill) => sum + Number(bill.total) - Number(bill.total_gst), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const profit = revenue - totalExpenses;
    const shareA = Number((profit / 3).toFixed(2));
    const shareB = shareA;
    const shareC = Number((profit - shareA - shareB).toFixed(2));

    res.json({
      month,
      totalRevenue: Number(revenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalProfit: Number(profit.toFixed(2)),
      ownerShares: { ownerA: shareA, ownerB: shareB, ownerC: shareC }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
