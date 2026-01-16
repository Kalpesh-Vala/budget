# ⚡ Offline-First Quick Reference
## Key Concepts & Usage Examples

---

## 🎯 Core Principles

### 1. **Optimistic UI Updates**
```
User Action → Instant UI Update → Background Sync
```
**Never wait for server response**

### 2. **Idempotency**
```
Same operation × N times = Same result as × 1 time
```
**Prevents duplicate entries**

### 3. **Offline-First**
```
IndexedDB (local) → UI → Sync Queue → Server
```
**App works without internet**

---

## 📖 Usage Examples

### Adding an Expense (Instant UI)

```typescript
// ❌ OLD WAY (waits for server)
const response = await fetch('/api/expenses', { method: 'POST', body: data });
const result = await response.json();
setExpenses([...expenses, result.expense]); // Slow!

// ✅ NEW WAY (instant update)
await addExpense(data); // UI updates immediately, syncs in background
```

### Loading Expenses (From Local Storage)

```typescript
// Component
import { useExpenseStore } from '@/stores/expense-store';

function ExpensesPage() {
  const { expenses, loading, loadExpenses } = useExpenseStore();
  
  useEffect(() => {
    loadExpenses(userId, selectedMonth); // Loads from IndexedDB
  }, [selectedMonth]);
  
  return (
    <div>
      {expenses.map(exp => (
        <ExpenseRow key={exp.id} expense={exp} />
      ))}
    </div>
  );
}
```

### Checking Sync Status

```typescript
import { syncService } from '@/services/sync-service';

async function checkSyncStatus() {
  const status = await syncService.getSyncStatus();
  
  console.log('Syncing:', status.syncing);
  console.log('Pending:', status.pendingCount);
  console.log('Has errors:', status.hasErrors);
  console.log('Last sync:', new Date(status.lastSync));
}
```

### Manual Sync Trigger

```typescript
import { syncService } from '@/services/sync-service';

// Force immediate sync
await syncService.triggerSync();

// Retry failed syncs
await syncService.retryFailedSyncs();
```

---

## 🔧 API Integration

### Backend Endpoint (with Idempotency)

```typescript
import { withIdempotency } from '@/middleware/idempotency';

export async function POST(request: NextRequest) {
  return withIdempotency(request, async (req) => {
    const data = await req.json();
    const idempotencyKey = req.headers.get('X-Idempotency-Key');
    
    // Check for duplicate
    const existing = await Expense.findOne({ idempotencyKey });
    if (existing) {
      return NextResponse.json({ expense: existing }, { status: 200 });
    }
    
    // Create new
    const expense = await Expense.create({ ...data, idempotencyKey });
    return NextResponse.json({ expense }, { status: 201 });
  });
}
```

### Frontend Request (with Idempotency Key)

```typescript
const idempotencyKey = createIdempotencyKey();

const response = await fetch('/api/expenses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': idempotencyKey, // Critical!
  },
  body: JSON.stringify(data),
});
```

---

## 📱 Mobile Optimization Patterns

### Network-Aware Page Sizes

```typescript
import { useNetworkAwarePageSize } from '@/hooks/useNetworkAware';

function ExpenseList() {
  const pageSize = useNetworkAwarePageSize(50);
  // Returns: 10 on slow 2G/3G, 20 on data saver, 50 on fast network
  
  return <PaginatedList pageSize={pageSize} />;
}
```

### Conditional Feature Loading

```typescript
import { useShouldLoadHeavyFeatures } from '@/hooks/useNetworkAware';

function Dashboard() {
  const loadHeavy = useShouldLoadHeavyFeatures();
  
  return (
    <div>
      <ExpenseList />
      {loadHeavy && <ExpensiveCharts />}
      {loadHeavy && <AdvancedAnalytics />}
    </div>
  );
}
```

### Virtualized Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualExpenseList({ expenses }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5, // Render 5 extra items
  });
  
  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={{ transform: `translateY(${item.start}px)` }}>
            <ExpenseRow expense={expenses[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔍 Debugging

### Check IndexedDB Data

```javascript
// In browser console
const db = await window.indexedDB.open('BudgetTrackerDB');

// View expenses
await db.expenses.toArray();

// View sync queue
await db.syncQueue.toArray();

// Check pending count
await db.syncQueue.count();
```

### Monitor Sync Events

```typescript
// Add logging to sync service
syncService.addEventListener('syncStart', () => {
  console.log('🔄 Sync started');
});

syncService.addEventListener('syncComplete', ({ pendingCount }) => {
  console.log(`✅ Sync complete. ${pendingCount} items remaining`);
});

syncService.addEventListener('syncError', ({ error }) => {
  console.error('❌ Sync failed:', error);
});
```

### Clear All Local Data

```typescript
import { db } from '@/db/schema';

// Clear everything (for logout or reset)
await db.clearAllData();
```

---

## 🎨 UI Components

### Sync Status Indicator

```typescript
import { SyncIndicator } from '@/components/common/SyncIndicator';

function Layout({ children }) {
  return (
    <div>
      {children}
      <SyncIndicator /> {/* Shows pending sync count */}
    </div>
  );
}
```

### Expense Item with Sync Status

```typescript
function ExpenseRow({ expense }) {
  const getStatusIcon = () => {
    switch (expense.syncStatus) {
      case 'synced': return '✅';
      case 'pending': return '⏳';
      case 'syncing': return '🔄';
      case 'error': return '⚠️';
    }
  };
  
  return (
    <div>
      <span>{expense.description}</span>
      <span>{getStatusIcon()}</span>
    </div>
  );
}
```

---

## ⚙️ Configuration

### Adjust Sync Intervals

```typescript
// In sync-service.ts

// Change periodic sync interval (default: 30s)
this.syncInterval = setInterval(() => {
  this.triggerSync();
}, 60000); // 1 minute

// Change retry backoff (default: 1s, 2s, 4s, 8s, 16s... max 5min)
const delay = Math.min(1000 * Math.pow(2, attempts), 600000); // max 10min
```

### Adjust Cache TTL

```typescript
// In cache-manager.ts

// Memory cache TTL (default: 30s)
private readonly MEMORY_TTL = 60000; // 1 minute

// IndexedDB cache TTL (default: 1 hour)
await setInDB(key, data, 7200000); // 2 hours
```

### Adjust Memory Limits

```typescript
// In memory-manager.ts

// Max expenses in memory (default: 500)
private readonly MAX_EXPENSES_IN_MEMORY = 1000;

// Max cache size (default: 10MB)
private readonly MAX_CACHE_SIZE_MB = 20;
```

---

## 🧪 Testing Checklist

### Offline Scenarios
- ✅ Add expense offline → UI updates instantly
- ✅ Go online → Expense syncs automatically
- ✅ Delete expense offline → Removed from UI
- ✅ Update expense offline → Changes reflected

### Duplicate Prevention
- ✅ Add same expense twice quickly → Only one created
- ✅ Retry failed sync → No duplicates
- ✅ Multiple tabs → Idempotency works

### Conflict Resolution
- ✅ Edit expense on two devices → Conflict detected
- ✅ Last write wins → Correct data preserved
- ✅ Version mismatch → 409 status returned

### Performance
- ✅ UI updates < 50ms
- ✅ Sync completes < 200ms (p95)
- ✅ Page load < 2s on 3G
- ✅ Smooth scrolling (60fps)

---

## 📊 Performance Metrics

### Track Sync Performance

```typescript
const start = performance.now();
await syncService.triggerSync();
const duration = performance.now() - start;

console.log(`Sync took ${duration}ms`);

// Send to analytics
sendMetric('sync_duration', duration);
```

### Monitor Storage Usage

```typescript
import { db } from '@/db/schema';

const { usage, quota } = await db.getStorageEstimate();
console.log(`Using ${(usage / 1024 / 1024).toFixed(2)}MB of ${(quota / 1024 / 1024).toFixed(2)}MB`);
```

### Track UI Responsiveness

```typescript
const addExpenseStart = performance.now();
await addExpense(data);
const uiUpdateTime = performance.now() - addExpenseStart;

console.log(`UI updated in ${uiUpdateTime}ms`); // Should be < 50ms
```

---

## 🚀 Production Checklist

### Before Deploy
- ✅ Updated package.json dependencies
- ✅ Added Upstash Redis credentials
- ✅ Migrated existing data (idempotencyKey field)
- ✅ Updated API routes with idempotency
- ✅ Added sync indicator to UI
- ✅ Tested offline scenarios
- ✅ Tested concurrent users

### Post Deploy
- ✅ Monitor sync success rate (target: >99%)
- ✅ Monitor API latencies (target: <200ms p95)
- ✅ Check for duplicate entries (target: zero)
- ✅ Monitor storage usage
- ✅ Check error logs

---

## 🆘 Common Issues

### "Quota exceeded" error
**Cause:** IndexedDB storage full  
**Solution:** Run memory cleanup, prune old data

### Sync stuck in "syncing" state
**Cause:** Network error during sync  
**Solution:** Reset sync status, retry

### UI not updating
**Cause:** Zustand store not connected  
**Solution:** Verify useExpenseStore hook usage

### Duplicates in database
**Cause:** Missing idempotency key or index  
**Solution:** Add unique index, check API headers

---

## 🎓 Best Practices

1. **Always include idempotency keys** in mutations
2. **Load from IndexedDB first**, sync in background
3. **Update UI immediately**, don't wait for server
4. **Handle offline gracefully**, show clear status
5. **Test with slow networks** (throttle in DevTools)
6. **Monitor sync queue size** (alert if > 100)
7. **Clean up old data** periodically
8. **Version all mutations** for conflict detection

---

## 📚 Additional Resources

- **Dexie.js Docs**: https://dexie.org/docs/Tutorial/Getting-started
- **Zustand Guide**: https://docs.pmnd.rs/zustand/getting-started/introduction
- **Service Worker API**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Background Sync**: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/

---

**Happy coding! 🚀**
