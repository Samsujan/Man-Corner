const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Inventory', 'Utilities', 'Rent', 'Salaries', 'Maintenance', 'Marketing', 'Other'],
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Online'],
    default: 'Cash'
  },
  billScreenshot: String, // File path
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', ExpenseSchema);
