const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['owner', 'guest'], 
    default: 'guest' 
  },
  permissions: {
    billing: Boolean,
    expenses: Boolean,
    analytics: Boolean,
    users: Boolean,
    profitShare: Boolean
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
