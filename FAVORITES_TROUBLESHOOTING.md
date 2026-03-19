# Favorites Feature - Troubleshooting Guide

## Heart Button Not Working

When you click the heart button, nothing happens. Here's how to debug:

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Click on the heart button again
4. Look for log messages like:
   ```
   API Configuration: { API_BASE_URL: "...", VITE_BACKEND_URL: "..." }
   FavoriteButton clicked { userId: "...", destination: "Paris", ... }
   addFavorite request: { url: "...", body: {...} }
   ```

### Step 2: Verify Backend URL
Check the console output for `API_BASE_URL`. It should be:
- **Production**: `https://ai-travel-agent-backend.vercel.app` (if deployed on Vercel)
- **Development**: `http://localhost:3000` (if running locally)

**If it shows `http://localhost:3000`:**
- Make sure your backend is running locally
- Run: `npm run dev` in the `backend/` folder

**If it shows nothing or `undefined`:**
- Set the environment variable `VITE_BACKEND_URL` in your `.env.local` file in the `frontend/` folder:
  ```
  VITE_BACKEND_URL=https://ai-travel-agent-backend.vercel.app
  ```
- Or for local development:
  ```
  VITE_BACKEND_URL=http://localhost:3000
  ```

### Step 3: Check Backend Response
In the console, look for messages like:
```
addFavorite response: { status: 200, result: {...} }
```

**If you see a network error:**
```
Error adding favorite: TypeError: Failed to fetch
```
This means:
- Backend is not running or not accessible
- VITE_BACKEND_URL is wrong
- CORS issue (backend not allowing requests)

**If you see status 500:**
```
addFavorite response: { status: 500, result: {...} }
```
The backend encountered an error. Check the backend logs.

### Step 4: Check Database Schema
For favorites to work, the `favorites` table must exist in Supabase:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the full `database-schema.sql` file from the root of the project
5. Click **Run**

Look for the `CREATE TABLE IF NOT EXISTS favorites` section.

### Step 5: Verify Environment Variables

**Frontend** (`frontend/.env.local`):
```
VITE_BACKEND_URL=https://ai-travel-agent-backend.vercel.app
VITE_SUPABASE_URL=https://hnwwggdikfatowcplwct.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=https://hnwwggdikfatowcplwct.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 6: Check userId
In the console, verify that `userId` is being passed correctly:
```
FavoriteButton clicked { userId: "abc123", destination: "Paris", ... }
```

If `userId` is empty or missing:
- Make sure you're logged in
- Check that the user authentication is working

## Complete Debugging Process

1. **Open Console** (F12) and check for error messages
2. **Click heart button** and look for what's logged
3. **If error about backend URL**:
   - Set `VITE_BACKEND_URL` in `.env.local`
   - Restart frontend development server
   - Clear browser cache (Ctrl+Shift+Delete)
4. **If error about database**:
   - Deploy the schema to Supabase (see Step 4 above)
   - Wait 2-3 seconds and try again
5. **If no logs appear at all**:
   - Clear browser cache
   - Restart development server
   - Hard refresh page (Ctrl+F5)

## Quick Checklist

- [ ] Browser console shows `API Configuration` message with correct backend URL
- [ ] Browser console shows `FavoriteButton clicked` when you click the heart
- [ ] Backend is running (if using localhost)
- [ ] `favorites` table exists in Supabase
- [ ] Environment variables are set correctly
- [ ] You are logged in (userId exists)
- [ ] Network tab shows successful POST requests to `/api/favorites`

## Still Not Working?

1. Copy the entire console output
2. Try the backend health check: Visit `https://ai-travel-agent-backend.vercel.app/api/health` (or your backend URL)
3. Should see a response like: `{ status: 'ok' }`

If the health check fails, the backend is not running or not accessible.
