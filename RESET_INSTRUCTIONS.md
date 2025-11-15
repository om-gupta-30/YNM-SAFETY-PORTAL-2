# Database Reset Instructions

## To Reset All Data and Start Fresh

### Step 1: Set up MongoDB Connection

1. Create a `.env` file in the `backend/` folder if it doesn't exist:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and set your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ynm_safety_portal
JWT_SECRET=your-secret-key-here
```

**OR** if using local MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/ynm_safety_portal
```

### Step 2: Run the Reset Script

```bash
cd backend
node scripts/resetDatabase.js
```

This will:
- ✅ Drop all existing collections (Users, Products, Manufacturers, Orders, Tasks, Locations)
- ✅ Recreate empty collections
- ✅ Insert ONLY the 4 core users:
  - Admin (Admin@123)
  - Om1 (Om1@123)
  - Om2 (Om2@123)
  - Om3 (Om3@123)

### Step 3: Clear Browser localStorage

Open browser console (F12) on any page and run:
```javascript
localStorage.clear();
location.reload();
```

Or manually clear:
- Open DevTools (F12)
- Go to Application/Storage tab
- Click "Clear site data" or manually delete all localStorage items

### Step 4: Verify Reset

1. Login with Admin credentials
2. Check:
   - Tasks page: Should show "No tasks found."
   - Orders page: Should show "No orders yet."
   - Products page: Should show empty or only default data
   - Manufacturers page: Should show empty or only default data
   - Home page: All counts should be 0

## After Reset

The database is now completely fresh with:
- ✅ Only 4 users (Admin + 3 employees)
- ✅ No orders
- ✅ No tasks
- ✅ No test data
- ✅ Clean collections ready for production use

