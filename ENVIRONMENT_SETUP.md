# 🔧 Environment Setup Guide

## Quick Setup Checklist

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (copy from .env.example)
cp .env.example .env.local

# 3. Add your environment variables
# Edit .env.local with your credentials

# 4. Run development server
npm run dev
```

---

## 📦 Dependencies to Install

### Core Dependencies (Required)

```bash
npm install dexie zustand
```

**What they do:**
- `dexie` - IndexedDB wrapper for offline storage
- `zustand` - Lightweight state management

### Production Dependencies (Recommended)

```bash
npm install @upstash/redis @tanstack/react-virtual
```

**What they do:**
- `@upstash/redis` - Serverless Redis for idempotency
- `@tanstack/react-virtual` - List virtualization for performance

### All at Once

```bash
npm install dexie zustand @upstash/redis @tanstack/react-virtual
```

---

## 🔐 Environment Variables

### Create `.env.local` file

```env
# ================================
# Existing Variables (Keep These)
# ================================

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ================================
# New Variables (Add These)
# ================================

# Upstash Redis (for idempotency - production)
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your_redis_token_here

# Optional: Feature flags
ENABLE_OFFLINE_MODE=true
ENABLE_BACKGROUND_SYNC=true
SYNC_INTERVAL_MS=30000
```

---

## 🚀 Upstash Redis Setup (Free Tier)

### Step 1: Create Account

1. Go to https://upstash.com
2. Sign up with GitHub/Google
3. Free tier includes:
   - 10,000 commands/day
   - 256MB storage
   - Global edge network

### Step 2: Create Redis Database

1. Click "Create Database"
2. Choose:
   - **Name:** budget-tracker-cache
   - **Type:** Regional (or Global for better latency)
   - **Region:** Closest to your users
   - **TLS:** Enabled (recommended)
3. Click "Create"

### Step 3: Get Credentials

1. Open your database
2. Click "REST API" tab
3. Copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
4. Paste into `.env.local`:

```env
UPSTASH_REDIS_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_TOKEN=AYB1A...your-token-here
```

### Step 4: Test Connection

Create `scripts/test-redis.ts`:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

async function testConnection() {
  try {
    // Set a test value
    await redis.set('test-key', 'Hello from Budget Tracker!');
    
    // Get it back
    const value = await redis.get('test-key');
    console.log('✅ Redis connected successfully!');
    console.log('Test value:', value);
    
    // Clean up
    await redis.del('test-key');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run test:
```bash
npx tsx scripts/test-redis.ts
```

---

## 🗄️ MongoDB Setup (Already Have)

### Verify Connection

Your existing MongoDB should work as-is. Just ensure:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority
```

### Add New Indexes (After Database Migration)

Run these commands in MongoDB Compass or Atlas:

```javascript
// In expenses collection
db.expenses.createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true });
db.expenses.createIndex({ userId: 1, date: -1 });
db.expenses.createIndex({ userId: 1, category: 1, date: -1 });
```

Or via Node script (`scripts/add-indexes.ts`):

```typescript
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';

async function addIndexes() {
  await connectDB();
  
  console.log('Creating indexes...');
  
  // This will use indexes defined in schema
  await Expense.createIndexes();
  
  console.log('✅ Indexes created successfully!');
  process.exit(0);
}

addIndexes().catch(console.error);
```

---

## 📱 Browser Support

### Minimum Requirements

| Browser | Version | IndexedDB | Service Worker | Notes |
|---------|---------|-----------|----------------|-------|
| Chrome | 80+ | ✅ | ✅ | Full support |
| Firefox | 75+ | ✅ | ✅ | Full support |
| Safari | 13+ | ✅ | ⚠️ | SW limited |
| Edge | 80+ | ✅ | ✅ | Full support |
| Mobile Chrome | 80+ | ✅ | ✅ | Recommended |
| Mobile Safari | 13+ | ✅ | ⚠️ | Works, limited SW |

### Feature Detection

The code includes automatic fallbacks:

```typescript
// Check IndexedDB support
if (!('indexedDB' in window)) {
  console.warn('IndexedDB not supported - falling back to localStorage');
  // Fallback logic here
}

// Check Service Worker support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
} else {
  console.warn('Service Worker not supported - sync will be manual');
}
```

---

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Browser DevTools Setup

1. **Chrome DevTools**
   - Open: F12 or Ctrl+Shift+I
   - Go to "Application" tab
   - Check:
     - IndexedDB → BudgetTrackerDB
     - Service Workers
     - Cache Storage

2. **Network Throttling**
   - Network tab → Throttling dropdown
   - Test with: Fast 3G, Slow 3G, Offline

3. **Mobile Simulation**
   - Click device toolbar (Ctrl+Shift+M)
   - Choose: iPhone 12, Pixel 5, etc.

---

## 🧪 Testing Setup

### Test Environment Variables

Create `.env.test`:

```env
MONGODB_URI=mongodb://localhost:27017/budget-tracker-test
JWT_SECRET=test-secret-key
UPSTASH_REDIS_URL=http://localhost:6379
UPSTASH_REDIS_TOKEN=test-token
```

### Install Test Dependencies (Optional)

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

---

## 📊 Monitoring Setup (Optional but Recommended)

### Vercel Analytics

Already included with Vercel deployment. No setup needed.

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

Add to `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### PostHog (Product Analytics)

```bash
npm install posthog-js
```

Add to `.env.local`:
```env
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 🚀 Deployment Setup

### Vercel Deployment

1. **Connect Repository**
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```

2. **Add Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add UPSTASH_REDIS_URL
   vercel env add UPSTASH_REDIS_TOKEN
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`
5. Set for: Production, Preview, Development

---

## ✅ Verification Checklist

After setup, verify everything works:

### Local Development
- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:3000
- [ ] MongoDB connection works
- [ ] Can create/read expenses

### IndexedDB
- [ ] Open DevTools → Application → IndexedDB
- [ ] See "BudgetTrackerDB"
- [ ] Has tables: expenses, syncQueue, syncMetadata, cache

### Redis (if using)
- [ ] Run `scripts/test-redis.ts`
- [ ] See "✅ Redis connected successfully!"

### Service Worker
- [ ] Open DevTools → Application → Service Workers
- [ ] See registered service worker
- [ ] Status: "activated"

### Offline Mode
- [ ] Open DevTools → Network → Throttling → Offline
- [ ] Try adding expense
- [ ] Should work and show in UI
- [ ] Go back online
- [ ] Should sync automatically

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'dexie'"

**Solution:**
```bash
npm install dexie
```

### Error: "UPSTASH_REDIS_URL is not defined"

**Solution:**
1. Check `.env.local` exists
2. Verify variable is set correctly
3. Restart dev server (`npm run dev`)

### Error: "IndexedDB quota exceeded"

**Solution:**
```javascript
// Clear old data
import { db } from '@/db/schema';
await db.expenses.where('date').below(threeMonthsAgo).delete();
```

### Service Worker not updating

**Solution:**
1. DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister"
4. Refresh page

### MongoDB connection timeout

**Solution:**
1. Check MONGODB_URI is correct
2. Verify IP whitelist in MongoDB Atlas
3. Check network connectivity

---

## 📝 Next Steps

After environment setup:

1. ✅ Follow [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)
2. ✅ Start with Phase 1 (Foundation)
3. ✅ Test each phase incrementally
4. ✅ Deploy to staging before production

---

**Environment ready? Let's build! 🚀**
