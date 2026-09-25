const mongoose = require('mongoose');

const ProfitShareSchema = new mongoose.Schema({
  ownerA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerC: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharePercentageA: { type: Number, required: true }, // e.g., 33.33
  sharePercentageB: { type: Number, required: true },
  sharePercentageC: { type: Number, required: true },
  month: String, // YYYY-MM format
  totalProfit: Number,
  shareA: Number,
  shareB: Number,
  shareC: Number,
  settled: { type: Boolean, default: false },
  settledAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProfitShare', ProfitShareSchema);
