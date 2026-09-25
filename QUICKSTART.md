# Quick Start Guide - Maná Corner

## 🚀 Get Running in 5 Minutes

### Option 1: Using Docker (Recommended)

```bash
# Navigate to project root
cd mana-corner

# Start all services
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

### Option 2: Manual Installation

#### Step 1: Install MongoDB
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install -y mongodb`

#### Step 2: Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

#### Step 3: Setup Environment

```bash
# Create .env file in root directory
echo "MONGODB_URI=mongodb://localhost:27017/mana-corner" > .env
echo "JWT_SECRET=dev_secret_key_123" >> .env
echo "PORT=5000" >> .env
echo "NODE_ENV=development" >> .env
```

#### Step 4: Start the Application

```bash
# Terminal 1: Start Backend
npm run server

# Terminal 2: Start Frontend
cd client && npm start
```

---

## 📝 First Time Setup

### 1. Create Owner Accounts (3 owners)

Navigate to http://localhost:3000 and create accounts:

**Owner 1:**
- Name: Anurag Singh
- Email: anurag@manacorner.com
- Password: Owner@123
- Role: Owner

**Owner 2:**
- Name: Priya Sharma
- Email: priya@manacorner.com
- Password: Owner@123
- Role: Owner

**Owner 3:**
- Name: Rohit Patel
- Email: rohit@manacorner.com
- Password: Owner@123
- Role: Owner

### 2. Create Guest Accounts (2 guests - Billing only)

**Guest 1:**
- Name: Ravi Kumar
- Email: ravi@manacorner.com
- Password: Guest@123
- Role: Guest

**Guest 2:**
- Name: Anjali Desai
- Email: anjali@manacorner.com
- Password: Guest@123
- Role: Guest

---

## 🍪 Add Sample Menu Items

Login as an owner, go to Menu Management, and add:

| Item | Category | Price | GST |
|------|----------|-------|-----|
| Espresso | Coffee | ₹60 | 5% |
| Cappuccino | Coffee | ₹120 | 5% |
| Americano | Coffee | ₹80 | 5% |
| Green Tea | Tea | ₹60 | 5% |
| Masala Tea | Tea | ₹50 | 5% |
| Croissant | Pastries | ₹100 | 5% |
| Brownie | Desserts | ₹150 | 5% |
| Samosa | Snacks | ₹40 | 5% |
| Latte | Coffee | ₹130 | 5% |
| Iced Coffee | Beverages | ₹90 | 5% |

---

## 💳 Create Sample Bills

1. Login as a guest (billing user)
2. Go to Billing
3. Add items:
   - 2x Cappuccino
   - 1x Croissant
4. Total with GST: ₹347.45
5. Click "Complete Billing"
6. Choose payment method: Cash

Repeat 3-4 times with different items to build transaction history.

---

## 💸 Log Sample Expenses

1. Login as an owner
2. Go to Expenses
3. Add entries:

| Date | Category | Description | Amount |
|------|----------|-------------|--------|
| Today | Inventory | Coffee beans (1kg) | ₹2,500 |
| Today | Utilities | Electricity bill | ₹800 |
| Yesterday | Rent | Monthly rent | ₹15,000 |
| 2 days ago | Maintenance | Equipment repair | ₹1,500 |
| 3 days ago | Marketing | Social media ads | ₹500 |

---

## 📊 View Analytics & Reports

### Dashboard
- Overview of revenue, expenses, profit
- Quick action buttons for billing/expenses

### Analytics Page
- Profit & Loss calculations
- Expense forecast (trends and predictions)
- Budget planning suggestions
- AI cost-cutting recommendations

### Profit Sharing
- Select month to view
- See profit breakdown per owner
- Mark settlement when payments are done

---

## 🧪 Testing Checklist

### Billing Module
- [ ] Create multiple bills with different items
- [ ] Verify GST calculation (5%, 12%, 18%)
- [ ] Test all payment methods
- [ ] Check bill number uniqueness
- [ ] Verify bill history

### Expense Management
- [ ] Add expenses in different categories
- [ ] Upload receipt screenshots
- [ ] Filter by date range
- [ ] Verify category totals

### Analytics
- [ ] Check P&L calculations
- [ ] Verify revenue/expense totals
- [ ] Review forecasts
- [ ] Check cost recommendations

### User Management
- [ ] Login as different roles (owner/guest)
- [ ] Verify permission differences
- [ ] Test logout functionality
- [ ] Check role-based dashboards

---

## 🔑 Default Test Credentials

### Owner
```
Email: anurag@manacorner.com
Password: Owner@123
```

### Guest (Billing)
```
Email: ravi@manacorner.com
Password: Guest@123
```

---

## 📞 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list  # Mac
systemctl status mongodb  # Linux

# Start MongoDB
brew services start mongodb-community  # Mac
sudo systemctl start mongodb  # Linux
```

### Clear All Data (Reset)
```bash
# Stop the application
# Delete MongoDB data:
rm -rf /usr/local/var/mongodb/*  # Mac

# Or drop database:
# Connect to MongoDB shell and run:
# use mana-corner
# db.dropDatabase()
```

---

## 🚀 Next Steps

1. **Customize Domain**: Point www.manácorner.com to your server
2. **Set Up SSL**: Get HTTPS certificate (Let's Encrypt)
3. **Configure Backups**: Daily MongoDB backups
4. **Setup Monitoring**: Track server health & uptime
5. **Add Team Members**: Create accounts for staff
6. **Configure Payment Gateway** (Future): Integrate Stripe/Razorpay
7. **Mobile App**: Consider React Native version

---

## 📚 Useful Commands

```bash
# View server logs
npm run server

# View frontend dev server
cd client && npm start

# Build frontend for production
cd client && npm run build

# Run MongoDB shell
mongo

# Check running services
lsof -i :5000
lsof -i :3000

# Docker commands
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose logs -f      # View logs
docker-compose ps          # Check status
```

---

**Happy Cafe Management! ☕**

For detailed documentation, see `COMPLETE_DOCUMENTATION.md`
