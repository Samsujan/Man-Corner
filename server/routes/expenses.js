const express = require('express');
const multer = require('multer');
const path = require('path');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create expense
router.post('/', authMiddleware, upload.single('billScreenshot'), async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can add expenses' });
    }

    const expense = new Expense({
      ...req.body,
      date: new Date(req.body.date),
      billScreenshot: req.file ? req.file.path : null,
      createdBy: req.user.id
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get expenses
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view expenses' });
    }

    const { startDate, endDate, category } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view expenses' });
    }

    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name');
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
