# Budget Tracker - Environment Setup Guide

## Environment Variables Setup

### 1. MongoDB Atlas Connection String

**Steps to get MONGODB_URI:**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or login with your account
3. Create a new cluster (free tier available)
4. Go to "Database" → "Connect"
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Replace `<username>` with your database user name
9. Format: `mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority`

**Example:**
```
MONGODB_URI=mongodb+srv://john:mypassword@cluster0.abc123.mongodb.net/budget-tracker?retryWrites=true&w=majority
```

### 2. JWT Secret

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Output will be something like:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
```

**Copy this value to:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
```

### 3. Complete .env.local Example

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority

# JWT Configuration (32+ characters recommended)
JWT_SECRET=your_32_character_secret_key_here_generated_from_crypto

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. For Production (Vercel)

When deploying to Vercel, set these environment variables in Vercel dashboard:

**Settings → Environment Variables**

```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority

Name: JWT_SECRET
Value: your_32_character_secret_key

Name: NEXT_PUBLIC_APP_URL
Value: https://your-domain.vercel.app

Name: NODE_ENV
Value: production
```

### 5. Security Best Practices

✅ **DO:**
- Use strong passwords for database user
- Rotate JWT_SECRET every 3-6 months
- Use HTTPS in production
- Enable IP whitelist in MongoDB Atlas
- Keep secrets in .env.local (never commit to git)
- Use different secrets for dev and production

❌ **DON'T:**
- Share your JWT_SECRET with anyone
- Commit .env.local to git
- Use weak passwords
- Reuse secrets across projects
- Store secrets in code comments

### 6. MongoDB Atlas IP Whitelist

**Important:** For development, add 0.0.0.0/0 to whitelist, but for production:

1. Go to MongoDB Atlas Dashboard
2. Security → Network Access
3. Add your Vercel deployment IPs
4. For Vercel, you can use 0.0.0.0/0 with other security measures

### 7. Troubleshooting

**Error: "MONGODB_URI is not defined"**
- Make sure .env.local file exists in root directory
- Check spelling: MONGODB_URI (not MONGO_URI)
- Verify the connection string is correct

**Error: "JWT_SECRET is not defined"**
- Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to .env.local

**Error: "MongoDB connection timeout"**
- Check if cluster is running
- Verify IP is whitelisted in MongoDB Atlas
- Check internet connection
- Test connection string in MongoDB Compass

**Error: "Authentication failed"**
- Verify database user credentials
- Check if user has access to the database
- Reset user password in MongoDB Atlas

### 8. Testing Your Setup

After setting environment variables, test the connection:

```bash
npm run dev
```

Then:
1. Go to http://localhost:3000
2. Register a new account
3. Add an expense
4. Verify data appears in database

If you see expenses in your dashboard, environment is configured correctly! 🎉

---

**Questions?** Check MongoDB Atlas docs or contact support.
