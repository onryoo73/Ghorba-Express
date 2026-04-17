# Supabase Storage Setup Guide

Since the SQL migration requires table ownership, follow these steps in the Supabase Dashboard:

## Step 1: Create Buckets (via Dashboard UI)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. Create these 3 buckets:

### Bucket 1: post-images
- Name: `post-images`
- Public bucket: ✅ **Checked** (IMPORTANT!)
- Click **Save**

### Bucket 2: payment-proofs
- Name: `payment-proofs`  
- Public bucket: ✅ **Checked** (IMPORTANT!)
- Click **Save**

### Bucket 3: avatars (if not exists)
- Name: `avatars`
- Public bucket: ✅ **Checked**
- Click **Save**

## Step 2: Set Bucket Permissions

For each bucket, click on the bucket name, then go to **Policies** tab:

### For "post-images" bucket:

Click **New Policy** → **For full customization** (raw)

**Policy 1 - SELECT (View images):**
```
Name: Anyone can view post images
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 2 - INSERT (Upload images):**
```
Name: Authenticated users can upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: true
```

### For "payment-proofs" bucket:

**Policy 1 - SELECT:**
```
Name: Anyone can view payment proofs
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 2 - INSERT:**
```
Name: Authenticated users can upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: true
```

### For "avatars" bucket:

**Policy 1 - SELECT:**
```
Name: Anyone can view avatars
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 2 - INSERT:**
```
Name: Authenticated users can upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: true
```

## Step 3: Test Upload

After setting up:
1. Go to your app
2. Try creating a post with an image
3. Check browser console (F12) for upload logs
4. If it fails, the error will show in console

## Troubleshooting

If images still don't work:

1. **Check bucket is public**: Go to Storage → Buckets → click bucket → Settings → "Public bucket" should be ON

2. **Check URL format**: After upload, the URL should look like:
   ```
   https://peafpqmafisfmnkcsncr.supabase.co/storage/v1/object/public/post-images/user-id/filename.jpg
   ```

3. **Check CORS**: In Supabase Dashboard → Storage → Settings → CORS, add your domain:
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```

4. **Try direct upload test** in Supabase Dashboard:
   - Go to Storage → post-images → Upload a test file
   - If this fails, there's a project-level issue

## Alternative: Use SQL with Service Role

If you have access to run SQL with service_role, use this instead:

```sql
-- Run as supabase_admin or with service_role
BEGIN;

-- Create buckets
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES 
  ('post-images', 'post-images', true, now(), now()),
  ('payment-proofs', 'payment-proofs', true, now(), now()),
  ('avatars', 'avatars', true, now(), now())
ON CONFLICT (id) DO UPDATE SET public = true;

COMMIT;
```
