# Firestore Security Rules Configuration

## Error: Missing or insufficient permissions

This error occurs because your Firestore database security rules are not allowing read/write access to user documents.

## Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** from the left menu
4. Click on the **Rules** tab

### Step 2: Replace the existing rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events collection - all authenticated users can read
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Leaderboard or scores - all authenticated users can read
    match /leaderboard/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Game scores/results - users can write their own scores
    match /scores/{scoreId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the **Publish** button
2. Wait for confirmation that rules are deployed

## Explanation of Rules

### Users Collection
- **Read**: Any authenticated user can read user documents (needed for leaderboard, profiles)
- **Write/Create/Update**: Users can only modify their own document (userId matches their auth.uid)

### Events Collection
- **Read**: All authenticated users can view events
- **Write**: Only admin users can create/edit events

### Leaderboard/Scores
- **Read**: All authenticated users can view
- **Write**: All authenticated users can submit scores

## Alternative: Testing Mode (NOT RECOMMENDED FOR PRODUCTION)

If you want to quickly test without restrictions (USE ONLY FOR DEVELOPMENT):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning**: This allows any authenticated user to read/write all data. Use only for testing!

## Verify Rules are Working

After updating rules:
1. Reload your website
2. Try logging in
3. Navigate to user profile
4. Check browser console for any errors

If you still see errors, check:
- User is properly authenticated (check auth state in console)
- Firebase project is correctly configured
- User document exists in Firestore

## Common Issues

### Issue 1: Rules not taking effect
- Wait 1-2 minutes after publishing rules
- Clear browser cache and reload
- Check that rules were published successfully

### Issue 2: User document doesn't exist
- Make sure user registration creates document in Firestore
- Check `auth.js` - `saveUserToFirestore()` function
- Verify in Firebase Console > Firestore Database that user document exists

### Issue 3: Auth state not ready
- Make sure `onAuthStateChanged` completes before accessing data
- Add console logs to verify user is authenticated

## Testing the Fix

Run this in browser console after login:
```javascript
import { auth, db } from './js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const user = auth.currentUser;
if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then(doc => {
        if (doc.exists()) {
            console.log('User data:', doc.data());
        } else {
            console.log('User document does not exist');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}
```

If this works, the rules are correct!
