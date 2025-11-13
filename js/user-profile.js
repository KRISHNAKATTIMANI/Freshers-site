import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUserData = null;

// Game names mapping
const GAME_NAMES = {
    'riddle-rush': { name: 'Riddle Rush', icon: 'fa-brain' },
    'who-said-it': { name: 'Who Said It?', icon: 'fa-quote-left' },
    'truth-dare': { name: 'Truth or Dare', icon: 'fa-dice' },
    'word-scramble': { name: 'Word Scramble', icon: 'fa-spell-check' },
    'treasure-hunt': { name: 'Treasure Hunt', icon: 'fa-map-marked-alt' }
};

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadUserProfile(user);
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
});

// Load user profile data
async function loadUserProfile(user) {
    try {
        console.log('Loading profile for user:', user.uid);
        console.log('User email:', user.email);
        console.log('User displayName from Auth:', user.displayName);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.warn('User document not found. Creating new document...');
            
            // Create user document with default values
            const defaultUserData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || '',
                createdAt: serverTimestamp(),
                totalScore: 0,
                gamesPlayed: 0,
                level: 0,
                completedGames: [],
                isAdmin: false
            };
            
            console.log('Creating user document with data:', defaultUserData);
            await setDoc(userDocRef, defaultUserData);
            console.log('User document created successfully');
            
            // Display the default data
            displayUserData(user, defaultUserData);
            return;
        }
        
        const userData = userDoc.data();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 USER DATA FROM FIRESTORE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Display Name:', userData.displayName);
        console.log('USN:', userData.usn);
        console.log('Email:', userData.email);
        console.log('Level:', userData.level);
        console.log('Total Score:', userData.totalScore);
        console.log('Games Played:', userData.gamesPlayed);
        console.log('Completed Games:', userData.completedGames);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        displayUserData(user, userData);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Show user-friendly error message
        if (error.code === 'permission-denied') {
            alert('⚠️ Permission Error\n\nFirestore security rules are blocking access.\n\nPlease check FIRESTORE_RULES_FIX.md for instructions on how to fix this.');
        } else {
            alert('Error loading profile: ' + error.message);
        }
    }
}

// Function to display user data
function displayUserData(user, userData) {
    console.log('Displaying user data:', userData);
    console.log('User object:', user);
    
    // Display basic info
    const displayName = userData.displayName || userData.name || user.displayName || user.email?.split('@')[0] || 'Anonymous';
    const email = userData.email || user.email || 'N/A';
    
    console.log('Setting name:', displayName);
    console.log('Setting email:', email);
    
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userEmail').textContent = email;
    
    // Set avatar
    const avatar = document.getElementById('userAvatar');
    if (userData.photoURL) {
        avatar.src = userData.photoURL;
        avatar.onerror = function() { 
            this.src = 'images/default-user.svg'; 
        };
    } else {
        avatar.src = 'images/default-user.svg';
    }
    
    // Display level
    const level = userData.level || 0;
    document.getElementById('userLevel').textContent = level;
    
    // Display stats
    document.getElementById('totalScore').textContent = userData.totalScore || 0;
    document.getElementById('gamesPlayed').textContent = userData.gamesPlayed || 0;
    
    // Display completed games
    const completedGames = userData.completedGames || [];
    document.getElementById('completedGames').textContent = completedGames.length;
    
    // Update progress bar
    const totalGames = 5;
    const progressPercentage = (completedGames.length / totalGames) * 100;
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    document.getElementById('progressText').textContent = `${completedGames.length}/${totalGames} Games Completed`;
    
    // Display completed games badges
    
    // Update button text based on progress
    updateNextLevelButton(completedGames.length, totalGames);
}

// Update next level button based on progress
function updateNextLevelButton(completed, total) {
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    
    if (completed >= total) {
        nextLevelBtn.innerHTML = '<i class="fas fa-trophy"></i> All Games Completed!';
        nextLevelBtn.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
        nextLevelBtn.style.color = '#333';
    } else {
        const remaining = total - completed;
        nextLevelBtn.innerHTML = `<i class="fas fa-gamepad"></i> Next Level! (${remaining} game${remaining > 1 ? 's' : ''} remaining)`;
    }
}
