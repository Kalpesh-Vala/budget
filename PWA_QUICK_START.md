# PWA Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Icons
```bash
npm install sharp
node generate-pwa-icons.js
```

### 3. Build & Run
```bash
npm run build
npm start
```

### 4. Install App
- **Android:** Chrome menu → Install app
- **iOS:** Safari share → Add to Home Screen
- **Windows:** Edge install button in address bar
- **macOS:** Chrome menu → Install / Safari File → Add to Dock

### 5. Test Offline
- Chrome DevTools → Network → Offline
- Navigate pages - should work!

---

## 📱 Platform-Specific Steps

### Android (Chrome)
1. Open app in Chrome
2. Tap the install icon in address bar
3. Tap "Install"
4. Icon appears on home screen

### iOS (Safari)
1. Open app in Safari
2. Tap share button (⬆️)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

### Windows (Edge)
1. Open app in Edge
2. Click install icon in address bar
3. Click "Install"
4. App adds to Start Menu

### macOS (Chrome)
1. Open app in Chrome
2. Menu → Install Budget Tracker
3. Click "Install"

---

## ✨ Features

✅ Offline access
✅ Install as app
✅ Persistent 7-day login
✅ Push notifications ready
✅ Smart caching
✅ All platforms supported

---

## 📂 Key Files

```
package.json                    - next-pwa dependency
next.config.ts                  - PWA config with caching
public/manifest.json            - App metadata
public/icons/                   - App icons (192px & 512px)
src/app/layout.tsx              - PWA meta tags
src/components/common/InstallPrompt.tsx - Install UI
src/components/layout/DashboardLayout.tsx - Integrated InstallPrompt
```

---

## 🔧 Configuration

### Caching Strategies
```
APIs:           NetworkFirst (try network, fallback to cache)
Static Files:   CacheFirst (cache, update in background)
Images:         CacheFirst (cache, never expire)
Pages:          NetworkFirst (network, fallback to cache)
```

### Token Persistence
- JWT tokens stored in HTTP-only cookies
- Valid for 7 days
- Automatically sent with API requests
- Survives app closure/restart

---

## 🧪 Testing Checklist

- [ ] Install on Android
- [ ] Install on iOS
- [ ] Install on Windows
- [ ] Go offline - pages load
- [ ] Login persists after restart
- [ ] Icons display correctly
- [ ] Standalone mode (no browser UI)
- [ ] Theme color applies

---

## ⚡ Deploy to Production

### Vercel (Recommended)
```bash
vercel --prod
```

### Other Platforms
- Ensure HTTPS is enabled
- manifest.json is served correctly
- Service worker registered
- Icons in public/icons/ directory

---

## 🆘 Troubleshooting

### No Install Button?
- Check HTTPS is enabled
- Ensure manifest.json exists
- Clear browser cache
- Try different browser

### Offline Not Working?
- Navigate pages first (cache them)
- Check DevTools Service Workers tab
- Clear site data: Settings → Clear browsing data

### Login Lost?
- Check cookies aren't being deleted
- Verify HTTP-only cookie setting
- Ensure 7-day token hasn't expired

---

## 📊 Check PWA Quality

```bash
npm install -g lighthouse
lighthouse https://yourapp.com
```

Target: All green checkmarks ✅

---

## 🎉 You're Done!

Your app is now:
- 📱 Installable on all devices
- 🔌 Works offline
- 🔐 Persistent 7-day login
- ⚡ Super fast with caching
- 🎨 Native app experience

Enjoy! 🚀
