import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userName').textContent = user.displayName || 'Admin';
    
    // Set user avatar with fallback
    const avatarElement = document.getElementById('userAvatar');
    if (user.photoURL) {
        avatarElement.src = user.photoURL;
        avatarElement.onerror = function() {
            this.src = 'images/default-user.svg';
        };
    } else {
        avatarElement.src = 'images/default-user.svg';
    }
    
    await loadStats();
});

async function loadStats() {
    try {
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        document.getElementById('totalUsers').textContent = usersSnapshot.data().count;
        
        const usersCollection = await getDocs(collection(db, 'users'));
        let totalPlays = 0;
        usersCollection.forEach(doc => {
            totalPlays += doc.data().gamesPlayed || 0;
        });
        document.getElementById('totalPlays').textContent = totalPlays;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
