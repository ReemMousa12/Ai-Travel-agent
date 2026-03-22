# FOLLOW THESE EXACT STEPS TO FIX THE CORS ERROR NOW

## The Problem
Your backend on Vercel doesn't have the required environment variables configured. This causes 500 errors, which blocks CORS headers from being sent.

## STEP 1: Set Environment Variables (5 minutes)

### Go to Vercel Dashboard
- Open: https://vercel.com/dashboard
- **Click on:** `ai-travel-agent-backend` (NOT the frontend project!)
- **Click:** Settings (top navigation)
- **Click:** Environment Variables (left sidebar)

### Add These 3 Variables ONE BY ONE

**Variable #1:**
```
Name:  VITE_SUPABASE_URL
Value: [Get from https://app.supabase.com → Your Project → Settings → API → Project URL]
```

**Variable #2:**
```
Name:  VITE_SUPABASE_ANON_KEY
Value: [Get from https://app.supabase.com → Your Project → Settings → API → anon public]
```

**Variable #3:**
```
Name:  GROQ_API_KEY
Value: [Get from https://console.groq.com → API Keys → Create New API Key]
```

⚠️ **CRITICAL:** Click **Save** after each variable!

---

## STEP 2: Redeploy Backend (2 minutes)

### In Vercel Dashboard (still on backend project):
1. **Click:** Deployments (top navigation)
2. **Find:** The latest deployment at the top
3. **Click:** The three dots (...) menu on the right
4. **Click:** Redeploy
5. **Wait:**~30 seconds for deployment to complete
6. **You'll see:** "✅ Ready" when done

---

## STEP 3: Verify It Works (1 minute)

### Test the health endpoint:
Open this in your browser:
```
https://ai-travel-agent-backend.vercel.app/api/health
```

**You should see this response:**
```json
{
  "status": "ok",
  "message": "✅ AI Travel Agent Backend is running on Vercel",
  "timestamp": "2026-03-22T...",
  "cors": "enabled",
  "environment": {
    "SUPABASE_URL": "✅",
    "SUPABASE_ANON_KEY": "✅",
    "GROQ_API_KEY": "✅"
  }
}
```

**If you see "❌" for any of the three env vars, STOP and re-check Step 1**

---

## STEP 4: Test Frontend (1 minute)

1. **Go to:** https://ai-travel-agent-fn9y-...  (your frontend URL)
2. **Open DevTools:** F12
3. **Go to:** Console tab
4. **Clear the console** (trash icon)
5. **Refresh the page:** F5
6. **Look for CORS errors** - there should be NONE
7. **Try logging in** - should work without errors

---

## WHERE TO GET YOUR CREDENTIALS

### Supabase
1. Go to: https://app.supabase.com
2. Sign in
3. Click your project
4. Settings → API
5. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### GROQ
1. Go to: https://console.groq.com
2. Sign in / Create account
3. Click: API Keys (left sidebar)
4. Click: Create New API Key
5. Copy the key → `GROQ_API_KEY`

---

## CHECKLIST - Complete ALL items

- [ ] I went to Vercel backend project (NOT frontend)
- [ ] I set VITE_SUPABASE_URL
- [ ] I set VITE_SUPABASE_ANON_KEY
- [ ] I set GROQ_API_KEY
- [ ] I clicked SAVE after each variable
- [ ] I redeployed the backend
- [ ] I waited for deployment to show "Ready"
- [ ] I tested /api/health and saw all three env vars as ✅
- [ ] I refreshed the frontend and saw NO CORS errors
- [ ] The app now works!

---

## If It Still Doesn't Work

### Check #1: Wrong Project?
- Are you in the BACKEND project? (should say `ai-travel-agent-backend`)
- NOT the frontend project (should NOT say `ai-travel-agent`)

### Check #2: Variable Names Exact?
- Spelling EXACTLY right (case-sensitive)
- `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
- `GROQ_API_KEY` (exactly like this)

### Check #3: Full Values?
- Supabase URL should end with `.supabase.co`
- Supabase Key should be a long string starting with `eyJ`
- GROQ Key should start with `gsk_`

### Check #4: Redeployed?
- Going to Vercel Settings and adding variables does NOT auto-redeploy
- You MUST manually click "Redeploy"
- Wait 30 seconds for it to say "Ready"

---

## Still Stuck?

Share these details:
1. What error are you seeing? (exact error message)
2. Is it a CORS error or 500 error?
3. When you visit /api/health, do all three env vars show ✅?
