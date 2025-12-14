# Convex Backup System Setup

This system backs up your Users, Products, and Orders to a separate Convex database every hour.

## Setup Instructions

### 1. Add Environment Variables to your main project (.env.local)

```env
# Your backup Convex database URL
BACKUP_CONVEX_URL=https://your-backup-project.convex.cloud

# Secret for manual backup triggers (generate a random string)
CRON_SECRET=your-random-secret-here
BACKUP_SECRET=your-backup-secret-here
```

### 2. Setup Your Backup Convex Project

1. Create a new Convex project for backups:
   ```bash
   npx convex init backup-database
   cd backup-database
   ```

2. Copy these files to your backup Convex project:
   - `backup-convex-files/schema.js` → `convex/schema.js`
   - `backup-convex-files/backupReceiver.js` → `convex/backupReceiver.js`

3. Deploy the backup project:
   ```bash
   npx convex deploy
   ```

4. Get the backup project URL and add it to your main project's `.env.local`

### 3. How It Works

- **Vercel Cron** runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00...)
- Calls `/api/cron/backup` endpoint
- Fetches all users, products, orders from primary database
- Syncs them to backup database (upsert - updates existing, inserts new)

### 4. Manual Backup Trigger

You can trigger a backup manually:

```bash
curl -X GET https://your-site.com/api/cron/backup \
  -H "Authorization: Bearer your-cron-secret"
```

### 5. Files Created

**In your main project:**
- `convex/backup.js` - Queries to fetch data for backup
- `app/api/cron/backup/route.js` - Cron endpoint (hourly)
- `app/api/backup/route.js` - Manual backup endpoint
- `vercel.json` - Cron schedule config

**For your backup Convex project:**
- `backup-convex-files/schema.js` - Database schema
- `backup-convex-files/backupReceiver.js` - Mutations to receive data

### 6. Monitoring

Check Vercel dashboard → Cron Jobs to see backup execution logs.

### 7. Data Backed Up

| Table | Fields Backed Up |
|-------|-----------------|
| Users | email, name, phone, role, address, city, state, pincode, timestamps |
| Products | name, description, price, category, images, stock, sizes, colors, etc. |
| Orders | odid, userId, items, totalAmount, status, paymentMethod, shippingAddress, etc. |

**Note:** Passwords and session tokens are NOT backed up for security.
