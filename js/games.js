import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display user info
    document.getElementById('userName').textContent = user.displayName || 'User';
    
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
});

// Add hover animations to game cards
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.zIndex = '1';
    });
});
