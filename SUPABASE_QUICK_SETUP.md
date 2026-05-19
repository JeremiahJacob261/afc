# Quick Supabase Setup Guide

## 📌 TL;DR - Fast Track

### 1. Create Supabase Project (2 min)
```
1. Visit https://supabase.com
2. Sign up/Login
3. Click "New Project"
4. Fill: Project name, Database password, Region
5. Click "Create new project" and wait for initialization
```

### 2. Get Your Credentials (1 min)
```
1. Once project loads, go to Settings → API
2. Copy: Project URL and anon public key
3. Save these somewhere safe
```

### 3. Create Database Schema (3 min)
```
1. Go to SQL Editor (left sidebar)
2. Click "New Query"
3. Copy ALL content from: supabase_schema.sql
4. Paste into editor
5. Click "Run" (or Ctrl+Enter)
6. Wait for success message
```

### 4. Update Your Code (1 min)
File: `pages/api/supabase.js`
```javascript
const supabaseUrl = 'https://YOUR-PROJECT-ID.supabase.co'
const supabaseKey = 'YOUR-ANON-KEY'
```

**Done!** Your database is ready.

---

## ✅ Verification Checklist

After setup, verify everything works:

### Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables (8 total):
- [ ] activa
- [ ] bets
- [ ] notification
- [ ] placed
- [ ] referral
- [ ] user_wallets
- [ ] users
- [ ] walle

### Check Sample Data
```sql
SELECT * FROM walle;  -- Should show 7 payment methods
```

### Check Indexes Exist
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

---

## 📊 Database Tables Overview

```
┌─────────────────────────────────────────┐
│ USERS (accounts, balance, VIP level)   │
├─────────────────────────────────────────┤
│  - 300+ users can be stored              │
│  - Referral chain support (3 levels)     │
│  - Balance tracking in USDT              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ BETS (matches available for betting)    │
├─────────────────────────────────────────┤
│  - Sports match listings                 │
│  - League, time, teams                   │
│  - Results tracking                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PLACED (user bets)                      │
├─────────────────────────────────────────┤
│  - Individual user bets                  │
│  - Stake, odds, profit tracking          │
│  - Win/loss status                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ NOTIFICATION (transactions)              │
├─────────────────────────────────────────┤
│  - Deposits/Withdrawals                  │
│  - Status tracking (pending/success)     │
│  - Payment method used                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ USER_WALLETS (payment methods)          │
├─────────────────────────────────────────┤
│  - Crypto wallets (TRC20, BTC, ETH)      │
│  - Bank accounts                         │
│  - One per user                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ REFERRAL (affiliate program)            │
├─────────────────────────────────────────┤
│  - Multi-level tracking (3 levels)       │
│  - Commission distribution                │
│  - Referral code management             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ACTIVA (bonuses & commissions)          │
├─────────────────────────────────────────┤
│  - Deposit bonuses                       │
│  - Affiliate commissions                 │
│  - Activity logs                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ WALLE (payment gateway methods)         │
├─────────────────────────────────────────┤
│  - Available payment options              │
│  - Enable/disable payment methods        │
│  - Status tracking                       │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration Changes to Make

### 1. Update Supabase Connection
**File:** `pages/api/supabase.js`

Find:
```javascript
const supabaseUrl = 'https://aidkzrgsgrfotjiouxto.supabase.co'
const supabaseKey = 'eyJ...' // Old key
```

Replace with your new credentials:
```javascript
const supabaseUrl = 'https://YOUR-PROJECT-ID.supabase.co'
const supabaseKey = 'YOUR-ANON-KEY-HERE'
```

### 2. Firebase Configuration (Keep as is)
**File:** `pages/api/firebase.js`

No changes needed if using same Firebase project. This handles authentication.

### 3. Environment Variables (Recommended)
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=YOUR-ANON-KEY
```

Update `pages/api/supabase.js`:
```javascript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
```

---

## 🚀 Testing the Connection

### Test 1: Direct Query (in Supabase Editor)
```sql
SELECT COUNT(*) as total_payment_methods FROM walle;
```
Expected result: `7`

### Test 2: From Your App
```javascript
// Test in any API route
import { supabase } from './supabase'

const testConnection = async () => {
  const { data, error } = await supabase.from('walle').select('*')
  console.log(data, error)
}
```

### Test 3: Create Test User
```sql
INSERT INTO users (
  userid, 
  uid, 
  username, 
  email, 
  newrefer,
  balance
) VALUES (
  'test-firebase-uid',
  'uid_test123',
  'testuser',
  'test@example.com',
  '1234567',
  100.00
);
```

Then verify:
```sql
SELECT * FROM users WHERE username = 'testuser';
```

---

## ⚠️ Important Security Notes

### Production Checklist:

- [ ] Enable Row Level Security (RLS) for sensitive tables
- [ ] Set up proper authentication policies
- [ ] Use environment variables for secrets
- [ ] Never commit credentials to git
- [ ] Enable database backups
- [ ] Set up connection pooling for high traffic
- [ ] Review and restrict API access via API Gateway
- [ ] Use service role key only on backend

### Recommended RLS Policies (Advanced):

```sql
-- Allow users to see only their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE placed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
ON users FOR SELECT
USING (auth.uid()::text = userid);
```

---

## 📱 Payment Methods Pre-loaded

Your `walle` table comes with these methods (can disable/add more):

1. **TRC20** - Tether on Tron (USDT)
2. **Bitcoin** - BTC
3. **Ethereum** - ETH
4. **Bank Transfer** - Traditional banking
5. **PayPal** - Digital wallet
6. **M-Pesa** - Mobile money
7. **GCash** - Mobile money

To add a new method:
```sql
INSERT INTO walle (name, available) 
VALUES ('Stripe', true);
```

To disable a method:
```sql
UPDATE walle SET available = false WHERE name = 'Bitcoin';
```

---

## 🎯 Database Performance Tips

1. **Use the indexes** - They're already created for common queries
2. **Limit results** - Always use `LIMIT` in queries
3. **Order matters** - Use `ORDER BY` to get predictable results
4. **Denormalization** - Some fields (like home/away in placed) are duplicated for query speed
5. **Monitor usage** - Check Supabase dashboard for slow queries

---

## 🆘 Common Issues & Fixes

### Issue: "Database connection failed"
```
Solution: Check supabaseUrl and supabaseKey in supabase.js
          Ensure they're copied correctly (no spaces)
```

### Issue: "Table doesn't exist"
```
Solution: Re-run the supabase_schema.sql file
          Check for error messages in SQL output
```

### Issue: "Foreign key constraint violation"
```
Solution: Check that referenced users/matches exist
          Insert parent records before child records
```

### Issue: "Permission denied"
```
Solution: Check that you're using anon key (not service key)
          Enable RLS policies if they're too restrictive
```

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Database Issues:** https://supabase.com/docs/guides/database
- **Authentication:** https://supabase.com/docs/guides/auth
- **API Reference:** https://supabase.com/docs/reference/javascript

---

## 🎉 Success Indicators

✅ You'll know everything is working when:

1. ✓ All 8 tables appear in the Supabase dashboard
2. ✓ 7 payment methods show in the `walle` table
3. ✓ You can insert test users successfully
4. ✓ Your app logs in and loads user data
5. ✓ Deposit/withdrawal flows work end-to-end
6. ✓ Bets are created and tracked
7. ✓ Referral links work

---

**Setup Time:** ~10 minutes  
**Complexity:** Easy  
**Cost:** Free tier available for development
