# Maná Corner - Cafe Management System

## 🎯 Overview

A complete cafe management system built for **Maná Corner** with multi-user roles, comprehensive billing, expense tracking, and AI-powered business insights.

**Domain**: www.manácorner.com

---

## 🚀 Features

### 1. **Billing Module** 💳
- **Menu Management**: Add/Edit/Delete menu items with categories
- **Dynamic Pricing**: Support for different GST rates (5%, 12%, 18%, 28%) per item
- **Bill Generation**: Auto-numbered bills with customer details
- **Payment Methods**: Cash, Card, UPI, Online transfers
- **Tax Calculation**: Automatic GST computation on items
- **Bill History**: Complete audit trail of all transactions

### 2. **Expense Tracking** 📊
- **Category-based Expenses**: Inventory, Utilities, Rent, Salaries, Maintenance, Marketing, Other
- **Document Upload**: Support for bill/receipt screenshots
- **Date-wise Tracking**: Easy filtering and search
- **Monthly Summaries**: Auto-calculated expense categories
- **Payment Proof**: Attached documentation for verification

### 3. **Financial Analytics** 📈
- **Profit & Loss Dashboard**: Real-time revenue, expenses, and profit calculations
- **Profit Margin Analysis**: Percentage-based profitability insights
- **GST Tracking**: Separate tracking of GST collected
- **Trend Analysis**: Month-over-month comparisons
- **Revenue Breakdown**: By payment method and category

### 4. **AI-Powered Insights** 🤖
- **Smart Recommendations**: Cost-cutting suggestions based on spending patterns
- **Expense Forecasting**: Predictive analytics for future expenses
- **Budget Planning**: Safe spending guidelines with buffers
- **Business Intelligence**: Automated advisor for business optimization
- **Anomaly Detection**: Alerts for unusual spending patterns

### 5. **Profit Sharing** 💰
- **Multi-owner Support**: Up to 3 owners with configurable share percentages
- **Automatic Calculation**: System calculates each owner's share
- **Settlement Tracking**: Records of profit distributions
- **Monthly Breakdowns**: Detailed owner-wise profit statements
- **Payment History**: Track who has been settled

### 6. **Budget Forecasting** 🎯
- **Quarterly Projections**: 3-month expense forecasts
- **Safety Buffers**: 20% cushion for unexpected costs
- **Running Costs**: Average monthly expense tracking
- **Trend Indicators**: Growth/decline in spending

---

## 👥 User Roles & Permissions

### **Owner Accounts (3 max)**
- ✅ Full system access
- ✅ Create/Edit menu items
- ✅ View all financial reports
- ✅ Log expenses with documents
- ✅ Access analytics & forecasting
- ✅ Manage profit sharing
- ✅ Manage user accounts
- ✅ Export reports

### **Guest Accounts (2 max - Billing Only)**
- ✅ Create bills
- ✅ View billing history
- ❌ Access to expense/analytics
- ❌ User management
- ❌ Financial reports

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Material-UI, Redux |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Tokens) |
| **Charts** | Chart.js, React-ChartJS-2 |
| **File Upload** | Multer |
| **API Communication** | Axios |
| **UI/UX** | Material Design, Custom Coffee-themed styling |

---

## 📁 Project Structure

```
mana-corner/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   ├── Bill.js
│   │   ├── Expense.js
│   │   └── ProfitShare.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   ├── billing.js
│   │   ├── expenses.js
│   │   ├── analytics.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Billing.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── ProfitShare.jsx
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   └── authSlice.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
├── uploads/
├── package.json
├── .env
└── README.md
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (running locally or Atlas)
- npm or yarn

### Backend Setup

```bash
# Navigate to project root
cd mana-corner

# Install dependencies
npm install

# Create .env file with:
MONGODB_URI=mongodb://localhost:27017/mana-corner
JWT_SECRET=your_super_secret_key_change_in_production
PORT=5000
NODE_ENV=development

# Start server
npm run server
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start
```

### Run Both Simultaneously

```bash
# From root directory
npm run dev
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Menu Management
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item (Owner only)
- `PUT /api/menu/:id` - Update menu item (Owner only)
- `DELETE /api/menu/:id` - Delete menu item (Owner only)

### Billing
- `POST /api/billing` - Create new bill
- `GET /api/billing` - Get all bills
- `GET /api/billing/:id` - Get specific bill

### Expenses
- `POST /api/expenses` - Add expense (Owner only)
- `GET /api/expenses` - Get all expenses (Owner only)
- `GET /api/expenses/:id` - Get specific expense (Owner only)

### Analytics
- `GET /api/analytics/revenue` - Revenue summary
- `GET /api/analytics/expenses-summary` - Expense summary
- `GET /api/analytics/profit-loss` - P&L statement
- `GET /api/analytics/recommendations` - Cost-cutting suggestions
- `GET /api/analytics/forecast` - Expense forecast
- `GET /api/analytics/budget-plan` - Budget planning
- `GET /api/analytics/profit-share/:month` - Monthly profit sharing

### Users
- `GET /api/users` - List all users (Owner only)
- `PUT /api/users/:id` - Update user (Owner only)
- `DELETE /api/users/:id` - Delete user (Owner only)

---

## 💼 Business Features

### Billing Workflow
1. **Menu Item Selection**: Select from available items
2. **Quantity Management**: Add/remove items and adjust quantities
3. **Automatic GST Calculation**: Taxes computed per item
4. **Bill Generation**: Auto-numbered, date-stamped
5. **Payment Recording**: Track payment method
6. **Bill History**: Full audit trail

### Expense Management
1. **Log Expense**: Add with category and proof
2. **Document Attachment**: Upload bills/receipts
3. **Category Tracking**: Organize by type
4. **Date-wise Filtering**: Easy retrieval
5. **Verification**: Records with proof

### Analytics & Reporting
- **Real-time Dashboard**: Live KPIs
- **Profit/Loss Analysis**: Monthly & yearly
- **Expense Trends**: Category breakdown
- **Revenue Analysis**: By payment method
- **Forecasting**: Next month predictions
- **Budget Alerts**: Safe spending limits

### Profit Sharing
- **Automatic Calculation**: System computes shares
- **Flexible Distribution**: Configurable percentages
- **Settlement Tracking**: Payment history
- **Monthly Statements**: Detailed breakdowns
- **Payment Records**: Who owes what

---

## 🎨 UI/UX Design

### Color Scheme (Cafe-themed)
- **Primary Brown**: #6f4e37 (Coffee brown)
- **Secondary Gold**: #d4a574 (Warm cream)
- **Background**: #f5f3f0 (Off-white)
- **Accent Colors**: Success green, warning orange, error red

### Design Principles
- **Minimalist & Modern**: Clean layouts, ample whitespace
- **Intuitive Navigation**: Easy to find features
- **Responsive**: Works on desktop, tablet, mobile
- **Accessibility**: WCAG compliant
- **Performance**: Fast loading, smooth interactions

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt encryption
- **Role-based Access Control**: Granular permissions
- **Input Validation**: Prevent injection attacks
- **File Upload Security**: Multer restrictions
- **Environment Variables**: Sensitive data protection
- **CORS Protection**: Cross-origin security

---

## 📱 Responsive Design

- **Desktop**: Full-featured interface (1920px+)
- **Tablet**: Touch-optimized (768px-1919px)
- **Mobile**: Compact layout (320px-767px)

---

## 🚀 Deployment

### Production Checklist
- [ ] Change JWT_SECRET in .env
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of local
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring & logging
- [ ] Backup strategy for MongoDB
- [ ] CDN for static assets

### Deployment Options
- **Heroku**: Easy deployment with free tier
- **AWS**: EC2 + RDS + S3
- **DigitalOcean**: Droplets + Managed Database
- **Render**: Modern alternative to Heroku
- **Vercel** (Frontend only): Auto-deployment

---

## 📝 Usage Examples

### Creating a Bill
```
1. Go to Billing page
2. Select items from menu (click Add button)
3. Adjust quantities as needed
4. Review bill summary (GST auto-calculated)
5. Choose payment method
6. Click "Complete Billing"
7. Receive bill number for reference
```

### Tracking Expenses
```
1. Go to Expenses page
2. Click "Add Expense"
3. Fill description, category, amount
4. (Optional) Upload receipt/bill
5. Submit
6. View in expense history with category breakdown
```

### Analyzing Performance
```
1. Go to Analytics page
2. View revenue, expenses, profit at a glance
3. Check cost-cutting recommendations
4. Review expense forecast
5. Plan budget for next month
6. Identify trends and optimize
```

### Managing Profit Sharing
```
1. Go to Profit Sharing page
2. Select month to analyze
3. View profit breakdown per owner
4. Review calculated shares
5. Mark as settled when payment complete
6. Track settlement history
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Solution: Ensure MongoDB is running
Linux/Mac: brew services start mongodb-community
Windows: MongoDB service should be running
```

### CORS Issues
```
Solution: Check API_URL in client environment
Ensure server CORS is configured correctly
```

### Build Issues
```
Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support & Contact

For issues, feature requests, or support:
- Email: support@manacorner.com
- Domain: www.manácorner.com
- GitHub Issues: [Repository Issues]

---

## 📄 License

This project is proprietary software for Maná Corner Cafe.

---

## 🎯 Roadmap

### Version 2.0
- [ ] Mobile app (React Native)
- [ ] Advanced inventory management
- [ ] Staff shift management
- [ ] Customer loyalty program
- [ ] Online ordering integration
- [ ] QR code billing
- [ ] Multi-location support
- [ ] Voice billing commands
- [ ] AI chatbot assistant
- [ ] Integration with accounting software

### Version 3.0
- [ ] Machine learning for demand forecasting
- [ ] Automated reorder management
- [ ] Dynamic pricing optimization
- [ ] Customer analytics
- [ ] Marketing automation
- [ ] Blockchain for settlement records

---

**Last Updated**: September 2026
**Version**: 1.0.0
