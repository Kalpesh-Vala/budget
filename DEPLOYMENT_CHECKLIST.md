#!/bin/bash

# Budget Tracker - Production Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Variables
- [ ] MONGODB_URI is set correctly
- [ ] JWT_SECRET is generated and set (32+ characters)
- [ ] NEXT_PUBLIC_APP_URL is configured
- [ ] NODE_ENV is set to 'production'

### 2. Code Quality
- [ ] No console.error statements left in production code
- [ ] All API endpoints have proper error handling
- [ ] All user inputs are validated
- [ ] All database queries are optimized

### 3. Security Checks
- [ ] Password hashing is enabled (bcrypt)
- [ ] JWT tokens have proper expiry (7 days)
- [ ] API routes check user authentication
- [ ] User data is isolated per user
- [ ] No sensitive data in frontend
- [ ] HTTPS is enforced in production

### 4. Database
- [ ] MongoDB Atlas cluster is created
- [ ] Database user is created
- [ ] Connection string is updated
- [ ] Backup is enabled
- [ ] Proper indexes are created
- [ ] Database user permissions are restricted

### 5. Testing
- [ ] User registration works
- [ ] Login/logout works
- [ ] Adding expenses works
- [ ] Editing expenses works
- [ ] Deleting expenses works
- [ ] Monthly summary generates correctly
- [ ] Category budget calculation is correct
- [ ] Analytics charts display data
- [ ] Responsive design works on mobile
- [ ] Dark mode works (if enabled)

### 6. Performance
- [ ] API responses are fast (<200ms)
- [ ] Database queries are optimized
- [ ] Images are optimized
- [ ] Code is minified in production

### 7. Deployment
- [ ] Code is pushed to GitHub
- [ ] Vercel project is created
- [ ] Environment variables are set in Vercel
- [ ] Build is successful
- [ ] Deployment is successful
- [ ] Live URL is accessible

### 8. Post-Deployment
- [ ] Test all features on live URL
- [ ] Verify authentication works
- [ ] Verify data persistence
- [ ] Check error handling
- [ ] Monitor performance
- [ ] Check logs for errors

## Deployment Commands

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

## Monitoring Checklist

- [ ] Setup error logging (Sentry, LogRocket, etc.)
- [ ] Setup performance monitoring (Vercel Analytics)
- [ ] Setup uptime monitoring (UptimeRobot, etc.)
- [ ] Setup database backups
- [ ] Setup log aggregation
- [ ] Create runbook for common issues

## Security Checklist

- [ ] Enable 2FA on GitHub account
- [ ] Enable 2FA on MongoDB Atlas account
- [ ] Enable 2FA on Vercel account
- [ ] Rotate secrets regularly
- [ ] Review API logs weekly
- [ ] Check for suspicious activity
- [ ] Update dependencies monthly

## Documentation Checklist

- [ ] README is complete
- [ ] API documentation is complete
- [ ] Database schema is documented
- [ ] Deployment process is documented
- [ ] Troubleshooting guide is complete
- [ ] Contributing guidelines are set

## Success Criteria

✅ All tests pass  
✅ No security vulnerabilities  
✅ Performance is acceptable  
✅ All features work as expected  
✅ User experience is smooth  
✅ Responsive on all devices  
✅ Ready for production
