# User Registration & Data Verification Guide

## ⚠️ CRITICAL FIELDS FOR JUDGING
- **Name**: Full name of the participant (minimum 3 characters)
- **USN**: University Serial Number (minimum 5 characters, stored in UPPERCASE)

These fields are:
- ✅ **MANDATORY** during registration
- 🔒 **READ-ONLY** after registration (cannot be edited)
- 📊 **LOADED FROM DATABASE** for display only

---

## 🔒 New Security Features Implemented

### 1. **Form Validation**
- Name: Minimum 3 characters, required, autocomplete disabled
- USN: Minimum 5 characters, required, auto-uppercase, autocomplete disabled
- Both fields marked with red asterisk (*)

### 2. **Backend Validation**
- Strict length checks before saving to Firestore
- Empty string detection and rejection
- Automatic uppercase conversion for USN
- Immediate verification after save

### 3. **Multi-Level Logging**
All registration steps now log:
```
🔍 FORM VALUES CAPTURED
✅ Field Validation
💾 USER DATA OBJECT TO SAVE
✅ VERIFICATION - DATA IN FIRESTORE
✅✅✅ ALL DATA VERIFIED SUCCESSFULLY
```

---

## 📋 Testing New Registration

### Step 1: Register a New User
1. Clear browser cache (Ctrl+Shift+Delete)
2. Open Console (F12)
3. Go to: http://localhost:8080
4. Register with:
   - **Name**: Test Student
   - **USN**: 1XX21CS999
   - **Email**: test@example.com
   - **Password**: Test@Pass123

### Step 2: Verify Console Output
You should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SAVING USER TO FIRESTORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Display Name to save: Test Student
USN to save: 1XX21CS999
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 USER DATA OBJECT TO SAVE:
{
  "displayName": "Test Student",
  "usn": "1XX21CS999",
  ...
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFICATION - DATA IN FIRESTORE:
Display Name: Test Student
USN: 1XX21CS999
✅✅✅ ALL DATA VERIFIED SUCCESSFULLY
```

### Step 3: Verify Dashboard Display
After login, dashboard should show:
- Top right: Name + "USN: 1XX21CS999"
- Welcome banner: "Welcome back, Test Student"
- Level badge: "Level 0"

### Step 4: Verify Profile Page
Click avatar → Profile should show:
- Name: Test Student
- USN: 1XX21CS999
- Email: test@example.com
- Level: 0

---

## 🔧 Managing Users with Missing Data

### ⚠️ Name and USN are READ-ONLY after registration

**If a user has missing Name or USN:**

**Option 1: Manual Firebase Console Update (Recommended)**
1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the user document by email or UID
4. Click on the document to edit
5. Update fields:
   - `displayName`: Enter the full name
   - `usn`: Enter USN in UPPERCASE
6. Click "Update" to save
7. User must refresh their browser to see changes

**Option 2: Delete and Re-register**
1. Delete user from Firebase Authentication
2. Delete user document from Firestore
3. Have user register again with correct information

### Why No Edit Function?
- Prevents accidental changes to critical judging data
- Maintains data integrity for competition records
- Forces accurate entry during registration
- Simplifies data management

---

## 🚨 Error Handling

### If Registration Fails:

**Console shows "CRITICAL: USN cannot be empty!"**
- Cause: USN field was empty
- Fix: Fill USN field completely before submitting

**Console shows "VERIFICATION FAILED"**
- Cause: Firestore permission issue
- Fix: Configure Firestore security rules (see FIRESTORE_RULES_FIX.md)

**Console shows "permission-denied"**
- Cause: Firestore rules not configured
- Fix: Add security rules in Firebase Console

---

## 📊 Data Structure in Firestore

Each user document contains:
```javascript
{
  uid: "user-firebase-id",
  email: "user@example.com",
  displayName: "Full Name",
  usn: "1XX21CS999",          // ALWAYS UPPERCASE
  photoURL: "",
  createdAt: Timestamp,
  totalScore: 0,
  gamesPlayed: 0,
  level: 0,
  completedGames: [],
  isAdmin: false
}
```

---

## ✅ Pre-Event Checklist

- [ ] Test registration with 3-5 dummy users
- [ ] Verify all USNs are captured correctly
- [ ] Check profile page shows all data
- [ ] Verify dashboard displays name + USN
- [ ] Test USN update button for existing users
- [ ] Export user list from Firestore for backup
- [ ] Confirm Firestore security rules are active
- [ ] Test on different browsers (Chrome, Firefox, Edge)

---

## 📞 Quick Verification Commands

Open Browser Console on any page and run:
```javascript
// Check current user data
auth.currentUser.uid

// Check Firestore document
getDoc(doc(db, 'users', auth.currentUser.uid))
  .then(doc => console.log(doc.data()))
```

---

## 🎯 For Event Day

1. Keep Firebase Console open → Firestore → users collection
2. Monitor registrations in real-time
3. Check for any empty USN fields immediately
4. Use update button or manual edit if needed
5. Export data periodically as backup

---

**Last Updated**: November 13, 2025
**Critical Fields**: Name, USN (both required and verified)
