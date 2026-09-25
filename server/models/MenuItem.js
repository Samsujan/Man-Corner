const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Coffee', 'Tea', 'Snacks', 'Pastries', 'Beverages', 'Desserts'],
    required: true 
  },
  price: { type: Number, required: true },
  gstRate: { 
    type: Number, 
    enum: [5, 12, 18, 28],
    default: 5 
  },
  description: String,
  image: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', MenuSchema);
