# Firestore Security Rules Setup

## ⚠️ Important: You must update your Firestore security rules for the admin dashboard to work properly!

### Steps to Update Firestore Rules:

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Copy the Rules**
   - Open the `firestore.rules` file in this project
   - Copy all the content

4. **Paste and Publish**
   - Paste the rules into the Firebase Console rules editor
   - Click the "Publish" button

### What These Rules Do:

#### Users Collection (`/users/{userId}`)
- ✅ **Read**: Any authenticated user can read user data
- ✅ **Create**: Users can create their own document during registration
- ✅ **Update**: Users can update their own data OR admin can update any user
- ✅ **Delete**: ONLY admin can delete users

#### Events Collection (`/events/{eventId}`)
- ✅ **Read**: Anyone can read events (even unauthenticated)
- ✅ **Create/Update/Delete**: ONLY admin can manage events

#### Admin Detection
The rules check if the authenticated user's email is `krishnakattimanimb@gmail.com` to grant admin privileges.

### Current Rules Overview:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'krishnakattimanimb@gmail.com';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### Troubleshooting:

**Error: "Missing or insufficient permissions"**
- Make sure you've published the new rules in Firebase Console
- Wait 1-2 minutes after publishing for rules to propagate
- Clear browser cache and reload the page
- Verify you're logged in as the admin email

**Admin features not working:**
- Confirm you're logged in with: `krishnakattimanimb@gmail.com`
- Check browser console for authentication errors
- Verify Firebase project is correctly configured

### Security Notes:

🔒 These rules ensure:
- Only authenticated users can access the application
- Users can only modify their own data (except admin)
- Only the admin can delete users and manage events
- Events are publicly readable for the dashboard

---

**Need Help?** Check the Firebase documentation: https://firebase.google.com/docs/firestore/security/get-started
