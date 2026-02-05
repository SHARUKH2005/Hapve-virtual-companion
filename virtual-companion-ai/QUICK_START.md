# 🚀 Quick Start Guide

## ✅ EASIEST WAY TO START (No Infinite Prompts!)

### Option 1: Use the Batch File (Recommended for Windows)
```bash
cd virtual-companion-ai
start-dev.bat
```

This will:
- ✅ Check if dependencies are installed
- ✅ Install only if missing (one time)
- ✅ Start all services in ONE terminal
- ✅ No infinite command prompts!

### Option 2: Use npm directly
```bash
cd virtual-companion-ai
npm run dev
```

**Note:** Make sure dependencies are installed first:
```bash
# One-time setup (only needed once)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 🛑 If You See Infinite Command Prompts

1. **Close ALL command prompt/PowerShell windows**
2. **Press Ctrl+C** in any terminal that's running
3. **Wait 5 seconds** for processes to stop
4. **Then use one of the methods above**

---

## 📋 What Each Service Does

- **Frontend** (port 3006) - React app you see in browser
- **Backend** (port 4000) - Node.js API server
- **Avatar Service** (port 8000) - FastAPI Python server for avatar generation

All three run together in ONE terminal window.

---

## 🔧 Troubleshooting

**Problem:** "npm install keeps running"
- **Solution:** Close all terminals, wait 5 seconds, then run `start-dev.bat` once

**Problem:** "Port already in use"
- **Solution:** Close the app using that port, or restart your computer

**Problem:** "Python not found"
- **Solution:** Install Python 3.10+ and add it to PATH

---

## ✅ Success Looks Like:

```
[BACKEND] Server running on port 4000
[AVATAR] Server running on port 8000
[FRONTEND] Server running on port 3006
```

Then open: **http://localhost:3006**

---

**That's it! Simple and clean.** ✅
