# 🎯 SETUP & INSTALLATION GUIDE

## 📍 Project Location
```
C:\Users\SAMSUJAN\mana-corner\
```

---

## 🚀 Getting Started (Choose One Method)

### Method 1: Docker (Easiest - Recommended)

```bash
# Prerequisites
# - Docker Desktop installed (https://www.docker.com/products/docker-desktop)
# - Docker Compose included with Docker Desktop

# Step 1: Navigate to project
cd C:\Users\SAMSUJAN\mana-corner

# Step 2: Start all services
docker-compose up -d

# Step 3: Wait for services to start (2-3 minutes)
docker-compose logs -f

# Step 4: Open in browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api/health
# MongoDB: localhost:27017

# Step 5: Stop when done
docker-compose down
```

---

### Method 2: Manual Installation (Development)

#### Prerequisites
- Node.js 14+ (https://nodejs.org/)
- MongoDB 4.4+ (https://www.mongodb.com/try/download/community)
- Git

#### Step 1: Install MongoDB

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer (msiexec.exe)
3. Follow installation wizard
4. MongoDB runs as Windows Service automatically

**Verify Installation:**
```bash
mongod --version
```

#### Step 2: Navigate to Project
```bash
cd C:\Users\SAMSUJAN\mana-corner
```

#### Step 3: Install Backend Dependencies
```bash
npm install
```

#### Step 4: Configure Environment
```bash
# File: .env (already created)
MONGODB_URI=mongodb://localhost:27017/mana-corner
JWT_SECRET=dev_secret_key_123
PORT=5000
NODE_ENV=development
```

#### Step 5: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

#### Step 6: Start Backend (Terminal 1)
```bash
npm run server
# Output should show:
# ✅ MongoDB Connected
# 🚀 Server running on port 5000
```

#### Step 7: Start Frontend (Terminal 2)
```bash
cd client
npm start
# Automatically opens browser at http://localhost:3000
```

---

## 🔐 First Login

### Initial Setup

1. **Register First Owner Account**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Fill form:
     ```
     Name: Your Name
     Email: owner1@manacorner.com
     Password: Owner@123
     Role: Owner
     ```
   - Click "Sign Up"
   - You'll be logged in automatically

2. **Create Additional Users** (Optional)
   - Logout (User menu → Logout)
   - Sign up with new email/role
   - Repeat for all desired accounts

---

## 📝 Verification Checklist

After starting the application:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:5000/api/health
- [ ] Can register a new account
- [ ] Can login with created account
- [ ] Dashboard shows (0 values initially)
- [ ] Sidebar menu visible with navigation options
- [ ] Can navigate to Billing page
- [ ] Can add menu items (Owner only)
- [ ] Can create expenses (Owner only)

---

## 🛠️ Project Structure

```
mana-corner/                    # Root folder
├── server/                     # Backend (Node.js)
│   ├── models/                # Database schemas (5 files)
│   ├── routes/                # API endpoints (6 files)
│   ├── middleware/            # Auth middleware
│   └── index.js              # Express server
├── client/                     # Frontend (React)
│   ├── public/                # Static HTML
│   ├── src/
│   │   ├── components/        # Reusable components (4 files)
│   │   ├── pages/             # Page components (5 files)
│   │   ├── store/             # Redux store (2 files)
│   │   ├── utils/             # Helpers (1 file)
│   │   └── App.js             # Main component
│   └── package.json           # Frontend dependencies
├── uploads/                    # File storage (for expenses)
├── .env                        # Environment variables
├── package.json               # Backend dependencies
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Backend container config
├── README.md                  # Main documentation
├── COMPLETE_DOCUMENTATION.md  # Detailed docs
├── PROJECT_SUMMARY.md         # What's built
└── QUICKSTART.md              # This guide
```

---

## 🚪 Access Points

| Component | URL/Port | Purpose |
|-----------|----------|---------|
| Frontend | http://localhost:3000 | User interface |
| Backend API | http://localhost:5000 | REST API |
| MongoDB | localhost:27017 | Database |
| MongoDB Compass | localhost:27017 | DB GUI (optional) |

---

## 📊 Database Schema (MongoDB)

Collections automatically created:

1. **users** - User accounts
2. **menuitems** - Menu items with pricing
3. **bills** - Transaction records
4. **expenses** - Expense entries
5. **profitshares** - Profit distribution records

---

## 🔧 Troubleshooting

### Issue: Port 5000 Already in Use

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual PID)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### Issue: MongoDB Connection Error

```bash
# Check MongoDB service
# Windows: Services app → Look for "MongoDB Server"
# If not running: net start MongoDB
# Or use MongoDB shell to verify:
mongosh
# Should connect successfully
```

### Issue: Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rmdir /s node_modules

# Reinstall
npm install
```

### Issue: Frontend Shows Blank Page

```bash
# Clear browser cache
# Close browser and reopen
# Check console for errors (F12 → Console tab)
```

### Issue: Cannot Login

1. Check if backend is running (see terminal)
2. Check if MongoDB has data (might need to register first)
3. Verify credentials are correct
4. Check browser console for errors (F12)

---

## 📱 Testing the Application

### Create Sample Data

1. **Add Menu Items** (as Owner)
   - Go to Menu Management
   - Add items with prices

2. **Create Bills** (as Guest/Owner)
   - Go to Billing
   - Select items
   - Complete bill

3. **Log Expenses** (as Owner)
   - Go to Expenses
   - Add expense entries

4. **View Analytics** (as Owner)
   - Go to Analytics
   - See calculated P&L and forecasts

---

## 🚀 Production Deployment

### Before Going Live

1. **Update Environment Variables**
   ```
   JWT_SECRET=your_super_secure_secret_key
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mana-corner
   ```

2. **Set Up MongoDB Atlas**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create cluster
   - Get connection string
   - Update in .env

3. **Configure SSL/HTTPS**
   - Get certificate from Let's Encrypt
   - Configure in server

4. **Deploy**
   - Heroku: `heroku create && git push heroku master`
   - AWS/DigitalOcean: Use Docker images
   - Render: Push to GitHub and connect

---

## 📞 Support

### Documentation
- Main Docs: `README.md`
- Detailed Docs: `COMPLETE_DOCUMENTATION.md`
- Project Summary: `PROJECT_SUMMARY.md`

### Common Tasks

**Resetting Database:**
```bash
# Stop application
# Delete local MongoDB data or drop database
# Restart application
```

**Viewing Server Logs:**
```bash
# Terminal running server will show logs
# For Docker: docker-compose logs backend
```

**Accessing MongoDB:**
```bash
# Using MongoDB Compass (GUI)
# URL: mongodb://localhost:27017

# Or using mongosh (CLI)
mongosh
use mana-corner
```

---

## ✅ Quick Verification

Run these commands to verify installation:

```bash
# Check Node.js version
node --version  # Should be 14+

# Check npm version
npm --version

# Check MongoDB
mongod --version

# Check Git
git --version

# Navigate to project
cd C:\Users\SAMSUJAN\mana-corner

# Check structure
ls  # Should show server, client, .env, package.json, etc.
```

---

## 🎉 You're Ready!

Once setup is complete:

1. ✅ Backend running on port 5000
2. ✅ Frontend running on port 3000
3. ✅ Database connected
4. ✅ Can login and use all features
5. ✅ Ready for data entry

**Start with:** http://localhost:3000

---

## 📌 Important Folders

| Folder | Purpose |
|--------|---------|
| `server/` | Backend API code |
| `client/src/` | Frontend React code |
| `uploads/` | User file uploads (expenses) |
| `node_modules/` | Dependencies (auto-generated) |

---

## 🔄 Daily Operations

### Starting the App
```bash
cd C:\Users\SAMSUJAN\mana-corner
docker-compose up -d          # or npm run dev for manual setup
```

### Stopping the App
```bash
docker-compose down            # or Ctrl+C in terminals
```

### Backing Up Data
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/mana-corner" --out=./backup
```

---

**Setup Complete! Happy Cafe Management! ☕**
