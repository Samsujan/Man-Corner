const express = require('express');
const Bill = require('../models/Bill');
const Expense = require('../models/Expense');
const ProfitShare = require('../models/ProfitShare');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get revenue summary
router.get('/revenue', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query);
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalGST = bills.reduce((sum, bill) => sum + bill.totalGST, 0);

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

// Get expense summary
router.get('/expenses-summary', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const byCategory = {};
    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    });

    res.json({
      totalExpenses,
      byCategory,
      expenseCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profit & loss
router.get('/profit-loss', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const { startDate, endDate } = req.query;
    let billQuery = {};
    let expenseQuery = {};

    if (startDate || endDate) {
      billQuery.createdAt = {};
      expenseQuery.date = {};
      if (startDate) {
        billQuery.createdAt.$gte = new Date(startDate);
        expenseQuery.date.$gte = new Date(startDate);
      }
      if (endDate) {
        billQuery.createdAt.$lte = new Date(endDate);
        expenseQuery.date.$lte = new Date(endDate);
      }
    }

    const bills = await Bill.find(billQuery);
    const expenses = await Expense.find(expenseQuery);

    const revenue = bills.reduce((sum, bill) => sum + (bill.total - bill.totalGST), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

    res.json({
      revenue,
      totalExpenses,
      profit,
      profitMargin: parseFloat(profitMargin),
      totalGST: bills.reduce((sum, bill) => sum + bill.totalGST, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cost-cutting recommendations (AI-powered)
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const expenses = await Expense.find().sort({ date: -1 }).limit(100);
    const byCategory = {};

    expenses.forEach(exp => {
      byCategory[exp.category] = byCategory[exp.category] || { total: 0, count: 0 };
      byCategory[exp.category].total += exp.amount;
      byCategory[exp.category].count += 1;
    });

    const recommendations = [];

    // Find highest average expenses
    Object.entries(byCategory).forEach(([category, data]) => {
      const average = data.total / data.count;
      if (category === 'Inventory' && average > 10000) {
        recommendations.push({
          priority: 'HIGH',
          category,
          suggestion: 'Review supplier contracts and negotiate better rates',
          potentialSavings: `₹${(average * 0.15).toFixed(2)}` // 15% savings
        });
      }
      if (category === 'Utilities' && average > 5000) {
        recommendations.push({
          priority: 'MEDIUM',
          category,
          suggestion: 'Consider energy-efficient upgrades and monitor usage patterns',
          potentialSavings: `₹${(average * 0.2).toFixed(2)}` // 20% savings
        });
      }
    });

    res.json({
      recommendations: recommendations.length > 0 ? recommendations : [
        {
          priority: 'MEDIUM',
          category: 'General',
          suggestion: 'Monitor expense trends monthly for cost optimization opportunities',
          potentialSavings: 'Variable'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expense forecast (predictive)
router.get('/forecast', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const expenses = await Expense.find().sort({ date: -1 }).limit(90); // Last 3 months

    const byMonth = {};
    expenses.forEach(exp => {
      const month = exp.date.toISOString().substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + exp.amount;
    });

    const months = Object.keys(byMonth).sort();
    const values = months.map(m => byMonth[m]);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Simple trend calculation
    const trend = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(2) : 0;

    res.json({
      historicalAverage: parseFloat(average.toFixed(2)),
      trendPercentage: parseFloat(trend),
      forecastedMonthlyExpense: parseFloat((average * (1 + parseFloat(trend) / 100)).toFixed(2)),
      message: trend > 0 ? '⚠️ Expenses are rising' : '✅ Expenses are stable/declining'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Budget planning
router.get('/budget-plan', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const lastMonthExpenses = await Expense.find({
      date: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        $lte: new Date()
      }
    });

    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const recommendedBuffer = lastMonthTotal * 0.2; // 20% buffer

    res.json({
      lastMonthActual: parseFloat(lastMonthTotal.toFixed(2)),
      recommendedMonthlyBudget: parseFloat((lastMonthTotal + recommendedBuffer).toFixed(2)),
      safetyBuffer: parseFloat(recommendedBuffer.toFixed(2)),
      quarterlyBudgetForecast: parseFloat(((lastMonthTotal + recommendedBuffer) * 3).toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profit share calculation
router.get('/profit-share/:month', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can access analytics' });
    }

    const { month } = req.params; // Format: YYYY-MM
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
    const endDate = new Date(year, parseInt(monthNum), 0);

    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    });

    const revenue = bills.reduce((sum, bill) => sum + (bill.total - bill.totalGST), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = revenue - totalExpenses;

    // Assuming equal 33.33% split
    const share = (profit / 3).toFixed(2);

    res.json({
      month,
      totalRevenue: parseFloat(revenue.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalProfit: parseFloat(profit.toFixed(2)),
      ownerShares: {
        ownerA: parseFloat(share),
        ownerB: parseFloat(share),
        ownerC: parseFloat(share)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
