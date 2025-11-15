# 🚀 Quick Start Guide - YNM Safety Portal

## Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Python 3** (v3.7 or higher) - [Download](https://www.python.org/)
- **MongoDB** - Either:
  - **Local MongoDB** installed and running, OR
  - **MongoDB Atlas** account (free tier works) - [Sign up](https://www.mongodb.com/cloud/atlas)

---

## Step 1: Set Up MongoDB

### Option A: Use Local MongoDB
1. Install MongoDB locally (if not already installed)
2. Start MongoDB service:
   ```bash
   # On macOS (using Homebrew):
   brew services start mongodb-community
   
   # On Linux:
   sudo systemctl start mongod
   
   # On Windows:
   # Start MongoDB from Services or run: net start MongoDB
   ```

### Option B: Use MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier)
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/ynm_safety_portal`)
4. Create a `.env` file in the `backend/` folder (see Step 2)

---

## Step 2: Configure Environment Variables (Optional)

If using MongoDB Atlas or custom settings, create a `.env` file in the `backend/` folder:

```bash
cd backend
nano .env  # or use any text editor
```

Add these lines:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ynm_safety_portal
PORT=3000
PDF_SERVICE_URL=http://localhost:5001/extract-pdf
JWT_SECRET=your-secret-key-here-change-this-in-production
```

**Note:** If using local MongoDB, you can skip this step (defaults to `mongodb://localhost:27017/ynm_safety_portal`)

---

## Step 3: Install Node.js Dependencies

```bash
cd "/Users/omg/Desktop/ysm portal demo workflow /backend"
npm install
```

---

## Step 4: Install Python Dependencies

```bash
cd "/Users/omg/Desktop/ysm portal demo workflow /python_service"
pip3 install -r requirements.txt
```

**Note:** If `pip3` doesn't work, try `pip` or `python3 -m pip install -r requirements.txt`

---

## Step 5: Start the Services

You need to run **3 services** simultaneously. Open **3 separate terminal windows/tabs**:

### Terminal 1: Start Node.js Backend (Port 3000)
```bash
cd "/Users/omg/Desktop/ysm portal demo workflow /backend"
npm start
```

**Expected output:**
```
Server running on port 3000
MongoDB Connected: ...
✅ Initialized core users
```

### Terminal 2: Start Python PDF Service (Port 5001)
```bash
cd "/Users/omg/Desktop/ysm portal demo workflow /python_service"
python3 app.py
```

**Expected output:**
```
 * Running on http://0.0.0.0:5001
 * Debug mode: on
```

### Terminal 3: (Optional) Check if MongoDB is running
```bash
# For local MongoDB:
mongosh  # or mongo (older versions)

# Should connect successfully
```

---

## Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

The Node.js backend serves the frontend files automatically.

---

## Step 7: Login Credentials

Use these credentials to log in:

**Admin:**
- Username: `Admin`
- Password: `Admin@123`

**Employees:**
- Username: `Om1` / Password: `Om1@123`
- Username: `Om2` / Password: `Om2@123`
- Username: `Om3` / Password: `Om3@123`

---

## 🛠️ Troubleshooting

### Backend won't start
- **Error: "MongoDB connection failed"**
  - Make sure MongoDB is running (local) or check your Atlas connection string
  - Verify `.env` file has correct `MONGODB_URI`

- **Error: "Port 3000 already in use"**
  - Change `PORT` in `.env` file or kill the process using port 3000:
    ```bash
    lsof -ti:3000 | xargs kill -9
    ```

### Python service won't start
- **Error: "Module not found"**
  - Make sure you installed dependencies: `pip3 install -r requirements.txt`
  - Try: `python3 -m pip install Flask flask-cors pdfminer.six Werkzeug`

- **Error: "Port 5001 already in use"**
  - Change port in `python_service/app.py` (line 301) or kill the process:
    ```bash
    lsof -ti:5001 | xargs kill -9
    ```

### Frontend can't connect to backend
- Make sure Node.js backend is running on port 3000
- Check browser console for errors
- Verify `frontend/src/js/api.js` has `BASE_URL = 'http://localhost:3000/api'`

### PDF upload not working
- Make sure Python service is running on port 5001
- Check that `backend/controllers/pdfController.js` has correct `PDF_SERVICE_URL`

---

## 📝 Quick Commands Summary

```bash
# 1. Install dependencies
cd backend && npm install
cd ../python_service && pip3 install -r requirements.txt

# 2. Start services (in separate terminals)
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd python_service && python3 app.py

# 3. Open browser
# Go to: http://localhost:3000
```

---

## 🎯 What's Running Where?

- **Frontend:** Served by Node.js backend at `http://localhost:3000`
- **Node.js API:** `http://localhost:3000/api/*`
- **Python PDF Service:** `http://localhost:5001/extract-pdf`
- **MongoDB:** `localhost:27017` (local) or MongoDB Atlas (cloud)

---

## ✅ Success Checklist

- [ ] MongoDB is running (local or Atlas)
- [ ] Node.js backend started successfully (port 3000)
- [ ] Python service started successfully (port 5001)
- [ ] Can access `http://localhost:3000` in browser
- [ ] Can log in with Admin credentials
- [ ] Can see home page with navigation buttons

---

**Need help?** Check the console logs in both terminal windows for error messages.

