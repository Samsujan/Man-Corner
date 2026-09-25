const express = require('express');
const Bill = require('../models/Bill');
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create bill
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    
    // Fetch menu items to get current pricing and GST rates
    const billItems = await Promise.all(
      items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menuItemId);
        const price = menuItem.price;
        const gstRate = menuItem.gstRate;
        const gstAmount = (price * item.quantity * gstRate) / 100;
        const totalAmount = (price * item.quantity) + gstAmount;

        return {
          menuItem: menuItem._id,
          quantity: item.quantity,
          price,
          gstRate,
          gstAmount,
          totalAmount
        };
      })
    );

    const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGST = billItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal + totalGST;

    // Generate bill number
    const billCount = await Bill.countDocuments();
    const billNumber = `MAN-${Date.now()}-${billCount + 1}`;

    const bill = new Bill({
      billNumber,
      createdBy: req.user.id,
      items: billItems,
      subtotal,
      totalGST,
      total,
      paymentMethod: paymentMethod || 'Cash'
    });

    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get bills
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bills = await Bill.find(query)
      .populate('items.menuItem')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bill by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('items.menuItem')
      .populate('createdBy', 'name');
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
