const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: Number,
    price: Number,
    gstRate: Number,
    gstAmount: Number,
    totalAmount: Number
  }],
  subtotal: Number,
  totalGST: Number,
  total: Number,
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'UPI', 'Online'],
    default: 'Cash'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Completed'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bill', BillSchema);
