# Vercel Environment Variables Setup

## 🚨 Why Backend is Crashing

The `500 INTERNAL_SERVER_ERROR` is likely because **environment variables are not set on Vercel**. The backend needs:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `GROQ_API_KEY` - Your Groq API key (for AI chat)

---

## ✅ Step-by-Step Setup

### **Step 1: Get Your Supabase Credentials**

1. Open [https://supabase.com](https://supabase.com)
2. Login with your account
3. Select your project
4. Click **Settings** in the left sidebar
5. Click **API** under Configuration
6. Copy these values:
   - **Project URL** → Copy to clipboard
   - **anon public** key → Copy to clipboard

### **Step 2: Go to Vercel Dashboard**

1. Open [https://vercel.com](https://vercel.com)
2. Login with your account
3. Click on your **AI Travel Agent** project
4. Click **Settings** tab (in top menu)
5. Click **Environment Variables** in left sidebar

### **Step 3: Add Environment Variables**

For each variable, click **Add New** and fill in:

#### Variable 1: SUPABASE_URL
```
Name: SUPABASE_URL
Value: [Paste your Supabase Project URL]
Environments: Select "Production" ✅
```
Then click **Save**

#### Variable 2: SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: [Paste your Supabase anon key]
Environments: Select "Production" ✅
```
Then click **Save**

#### Variable 3: GROQ_API_KEY (Optional but recommended)
```
Name: GROQ_API_KEY
Value: [Paste your Groq API key from https://console.groq.com/keys]
Environments: Select "Production" ✅
```
Then click **Save**

---

## 📋 Complete List of Variables

| Variable Name | Value | Where to Get |
|---|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API |
| `GROQ_API_KEY` | `gsk_...` | https://console.groq.com/keys |

---

## 🔄 After Setting Variables

1. **Vercel will automatically redeploy** your backend
2. Wait 2-3 minutes for deployment to complete

### **Step 4: Verify Backend is Working**

After deployment completes, open these URLs to verify:

**Check 1: Health endpoint**
```
https://ai-travel-agent-backend.vercel.app/api/health
```
Should show:
```json
{
  "status": "ok",
  "message": "AI Travel Agent Backend is running"
}
```

**Check 2: Debug endpoint** (shows which env vars are set)
```
https://ai-travel-agent-backend.vercel.app/api/debug/env
```
Should show:
```json
{
  "status": "debug",
  "environment_variables_configured": {
    "SUPABASE_URL": "✅ Set",
    "SUPABASE_ANON_KEY": "✅ Set",
    "GROQ_API_KEY": "✅ Set",
    "NODE_ENV": "production"
  }
}
```

**Check 3: Database can connect**
```
https://ai-travel-agent-backend.vercel.app/api/database/health
```
Should show database is connected

---

## 🐛 Troubleshooting

### Still seeing 500 error?
1. Go back to Vercel Settings → Environment Variables
2. Verify all variables are set
3. Click the **three dots** next to each variable → **Edit**
4. Make sure values have **no extra spaces** at beginning/end
5. Wait 5 minutes for redeploy + cache to clear

### Still crashing after variables are set?
1. Check Vercel deployment logs:
   - Go to your project on Vercel
   - Click **Deployments** tab
   - Click the latest deployment
   - Click **Runtime Logs**
   - Look for error messages

### CORS errors still appearing?
1. Clear browser cache: `Ctrl + Shift + Delete`
2. Hard refresh: `Ctrl + F5`

### Database table doesn't exist errors?
This is normal if you haven't deployed the schema yet!
- Run `database-schema.sql` in Supabase SQL Editor
- See [LOCATION_FEATURES.md](LOCATION_FEATURES.md) for instructions

---

## ✨ Quick Verification Checklist

After everything is set up:

- [ ] All 3 environment variables set on Vercel
- [ ] Health endpoint returns `{ status: "ok" }`
- [ ] Debug endpoint shows all ✅ Set
- [ ] No CORS errors in browser console
- [ ] Frontend can call backend API
- [ ] Database schema deployed to Supabase (optional)
- [ ] Location features working (after schema deployment)

---

## 🆘 Need Help?

If you're still getting 500 errors:

1. **Check Vercel logs:**
   - Project → Deployments → Latest → Runtime Logs
   
2. **Verify credentials are correct:**
   - Check copy/paste didn't include extra spaces
   - Make sure you're using the right Supabase project
   
3. **Hard reset:**
   - Clear cache: `Ctrl + Shift + Delete`
   - Hard refresh: `Ctrl + F5`
   - Wait 5 minutes for redeploy

4. **Check this file:**
   - Rerun the debug endpoint to see what's missing
   - Report what's NOT ✅ Set

---

## 📝 Summary

The backend crashes because environment variables aren't configured on Vercel. Once you add them to the Vercel dashboard, everything should work!

**Time to complete:** 5-10 minutes
