# Check if Favorites Table is Properly Set Up

Run these SQL queries in Supabase to verify the table is working:

## 1. Check if table exists
```sql
SELECT table_name FROM information_schema.tables WHERE table_name='favorites';
```
Should return one row with `favorites`.

## 2. Check table structure
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='favorites' ORDER BY ordinal_position;
```
Should show columns like: id, user_id, destination, country, type, reason, etc.

## 3. Check RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'favorites';
```
Should show the policy `Allow all access to favorites`.

## 4. Test insert directly (copy-paste this with your userId)
```sql
INSERT INTO favorites (user_id, destination, country, type) 
VALUES ('YOUR_USER_ID_HERE', 'Test Destination', 'Test Country', 'destination')
RETURNING *;
```
Replace `YOUR_USER_ID_HERE` with your actual user ID.

**If this returns data**, the table works and the issue is elsewhere.
**If you get an error**, there's a database configuration issue.

## 5. Check if data was inserted
```sql
SELECT * FROM favorites ORDER BY created_at DESC LIMIT 5;
```

---

## If the insert test succeeds but the app still doesn't work:

The issue might be that `.select()` in the Supabase JS client isn't returning data. This sometimes happens with RLS policies.

**Solution:** Modify the backend to NOT use `.select()` for the insert - just return success and fetch the data separately.

Create a new test file to verify:
