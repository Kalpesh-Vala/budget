# 🚀 Budget Tracker - Quick Reference Card

## Installation & Setup (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local

# 3. Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Edit .env.local with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_generated_secret

# 5. Run development server
npm run dev

# 6. Open http://localhost:3000
```

---

## Key Credentials

**Development Database**: MongoDB Atlas (free tier available)  
**Authentication**: JWT with 7-day expiry  
**Hashing**: Bcrypt (10 rounds)  
**API Port**: 3000 (default)  

---

## Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Environment Variables Checklist

```
✅ MONGODB_URI        - MongoDB connection string
✅ JWT_SECRET         - 32+ character secret key
✅ NEXT_PUBLIC_APP_URL - http://localhost:3000 (dev)
✅ NODE_ENV          - development / production
```

---

## API Endpoints Quick Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Expenses
```
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/[id]
DELETE /api/expenses/[id]
GET    /api/expenses/stats
```

### Monthly
```
GET    /api/monthly-costs
POST   /api/monthly-costs
```

---

## Pages Available

```
/login              - User login
/register           - New account
/dashboard          - Main dashboard
/expenses           - Daily expense management
/monthly-summary    - Auto-generated summary
/category-budget    - Budget tracking
/analytics          - Charts & insights
/profile            - Account settings
```

---

## Database Collections

### User
```javascript
{ _id, name, email, passwordHash, createdAt, updatedAt }
```

### Expense
```javascript
{ _id, userId, date, category, type, paymentMethod, description, amount }
```

### MonthlyCost
```javascript
{ _id, userId, month, rent, electricity, gas, maintenance, other }
```

---

## Expense Categories (9 Total)

✅ Grocery  
✅ Breakfast  
✅ Lunch  
✅ Dinner  
✅ Travel  
✅ Snacks  
✅ Personal  
✅ Shared  
✅ Extras  

---

## Payment Methods (4 Total)

✅ UPI  
✅ Cash  
✅ Card  
✅ Bank  

---

## Components Available

```
Button         - Multiple variants & sizes
Card           - Card with header/content/footer
Input          - Text input with validation
Select         - Dropdown selector
Table          - Data table with sorting
Alert          - Alert messages (4 types)
```

---

## Tech Stack Quick View

```
Frontend:  Next.js 16, React 19, TypeScript
Styling:   Tailwind CSS 4
Database:  MongoDB Atlas, Mongoose 8
Auth:      JWT, bcryptjs
Charts:    Recharts 2.10
Deploy:    Vercel
```

---

## Security Features

✅ Bcrypt password hashing  
✅ JWT token authentication  
✅ HTTP-only cookies  
✅ User data isolation  
✅ Input validation  
✅ Protected routes  
✅ API authentication checks  

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| MongoDB error | Check MONGODB_URI in .env.local |
| JWT error | Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Login not working | Clear cache, try incognito |
| Charts blank | Add expenses in current month |

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Test on live URL

---

## Features Summary

✅ User authentication  
✅ Daily expense tracking  
✅ Monthly summaries (auto-generated)  
✅ Category budgeting  
✅ Fixed vs variable costs  
✅ Interactive analytics  
✅ Multiple charts  
✅ Responsive design  
✅ Dark mode ready  
✅ Production-ready security  

---

## File Organization

```
src/
├── app/              # Pages & API routes
├── components/       # React components
├── lib/             # Models & utilities
├── hooks/           # Custom hooks
└── utils/           # Helper functions
```

---

## Learning Resources

- Next.js: https://nextjs.org/docs
- MongoDB: https://docs.mongodb.com
- JWT: https://jwt.io
- Tailwind: https://tailwindcss.com/docs
- Recharts: https://recharts.org

---

## Performance Metrics

⚡ **Database**: Compound indexes for fast queries  
⚡ **API**: Minimal payloads, efficient queries  
⚡ **Frontend**: Code splitting, lazy loading  
⚡ **Build**: Next.js automatic optimization  

---

## Support & Help

1. Check `.env.example` for variable template
2. Read `ENV_SETUP.md` for detailed setup
3. Check `DEPLOYMENT_CHECKLIST.md` before production
4. Review `README.md` for quick start
5. Check source code comments

---

## Success Checklist

- [ ] npm install completed
- [ ] .env.local created
- [ ] MONGODB_URI configured
- [ ] JWT_SECRET generated
- [ ] npm run dev working
- [ ] Can register account
- [ ] Can login successfully
- [ ] Can add expense
- [ ] Dashboard shows data
- [ ] Charts displaying correctly

---

## Quick Links

- **Spec File**: `budget-tracker-spec.md`
- **Setup Guide**: `ENV_SETUP.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This Card**: `QUICK_REFERENCE.md`

---

## Version Info

- Node.js: 18+
- npm: Latest
- Next.js: 16.1.1
- React: 19.2.3
- MongoDB: Atlas (cloud)

---

**You're ready to go! 🎉**

```bash
npm run dev
# Open http://localhost:3000
```

**Happy expense tracking! 💰**
