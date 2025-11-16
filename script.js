// Global state
let currentUser = null;
let currentLevel = 1;
let users = [];
let leaderboard = [];
let completedLevels = []; // Track completed levels

// Initialize particles on page load
window.addEventListener('load', () => {
    createParticles();
    updateStats();
    startCountdown();  // Add this line
});

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Countdown Timer
function startCountdown() {
    // Set the date we're counting down to - November 21, 2025 at 10:00 AM
    const eventDate = new Date('2025-11-21T10:00:00').getTime();
    
    const circumference = 2 * Math.PI * 65; // 2πr where r=65
    
    // Update the countdown every 1 second
    const countdownInterval = setInterval(function() {
        // Get current date and time
        const now = new Date().getTime();
        
        // Find the distance between now and the event date
        const distance = eventDate - now;
        
        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the result in the elements
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        
        // Update circular progress
        const daysCircle = document.getElementById('days-circle');
        const hoursCircle = document.getElementById('hours-circle');
        const minutesCircle = document.getElementById('minutes-circle');
        const secondsCircle = document.getElementById('seconds-circle');
        
        // Calculate progress (assuming max values)
        const daysProgress = (days % 365) / 365; // Max 365 days
        const hoursProgress = hours / 24;
        const minutesProgress = minutes / 60;
        const secondsProgress = seconds / 60;
        
        // Set stroke-dashoffset based on progress
        if (daysCircle) {
            const offset = circumference - (daysProgress * circumference);
            daysCircle.style.strokeDashoffset = offset;
        }
        if (hoursCircle) {
            const offset = circumference - (hoursProgress * circumference);
            hoursCircle.style.strokeDashoffset = offset;
        }
        if (minutesCircle) {
            const offset = circumference - (minutesProgress * circumference);
            minutesCircle.style.strokeDashoffset = offset;
        }
        if (secondsCircle) {
            const offset = circumference - (secondsProgress * circumference);
            secondsCircle.style.strokeDashoffset = offset;
        }
        
        // If the countdown is finished, display a message
        if (distance < 0) {
            clearInterval(countdownInterval);
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            
            // Reset circles
            if (daysCircle) daysCircle.style.strokeDashoffset = circumference;
            if (hoursCircle) hoursCircle.style.strokeDashoffset = circumference;
            if (minutesCircle) minutesCircle.style.strokeDashoffset = circumference;
            if (secondsCircle) secondsCircle.style.strokeDashoffset = circumference;
            
            // Optional: Show event started message
            const countdownSection = document.querySelector('.countdown-section h3');
            if (countdownSection) {
                countdownSection.textContent = '🎉 Event is Live!';
            }
        }
    }, 1000);
}

// Section navigation
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load data for specific sections
        if (sectionName === 'users') {
            displayUsers();
        } else if (sectionName === 'leaderboard') {
            displayLeaderboard();
        } else if (sectionName === 'game') {
            updateLevelButtons();
        }
    }
}

// Google Sign In Handler
function handleGoogleSignIn() {
    // In production, implement actual Google OAuth
    // For demo purposes, we'll simulate successful login
    console.log('Google Sign In initiated');
    
    // Simulate Google authentication
    setTimeout(() => {
        currentUser = {
            name: 'Demo User',
            email: 'demo@example.com',
            avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=2a5298&color=fff&size=150',
            score: 0,
            rank: users.length + 1,
            level: 1,
            completedLevels: [1] // Level 1 is unlocked by default
        };
        
        // Add user to users list
        users.push(currentUser);
        
        // Show success message
        alert('Successfully signed in with Google!');
        
        // Update stats
        updateStats();
        
        // Redirect to profile
        updateProfileView();
        showSection('profile');
    }, 1000);
}

// Handle credential response from Google
function handleCredentialResponse(response) {
    // Decode the JWT token to get user info
    const userInfo = parseJwt(response.credential);
    
    currentUser = {
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.picture,
        score: 0,
        rank: users.length + 1,
        level: 1,
        completedLevels: [1] // Level 1 is unlocked by default
    };
    
    users.push(currentUser);
    updateStats();
    updateProfileView();
    showSection('profile');
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Handle registration form
function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.elements[0].value;
    const email = form.elements[1].value;
    const password = form.elements[2].value;
    
    // Create new user
    currentUser = {
        name: name,
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a5298&color=fff&size=150`,
        score: 0,
        rank: users.length + 1,
        level: 1,
        completedLevels: [1] // Level 1 is unlocked by default
    };
    
    users.push(currentUser);
    
    alert('Registration successful!');
    updateStats();
    updateProfileView();
    showSection('profile');
}

// Update profile view with current user data
function updateProfileView() {
    if (!currentUser) return;
    
    document.getElementById('userAvatar').src = currentUser.avatar;
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userScore').textContent = currentUser.score;
    document.getElementById('userRank').textContent = `#${currentUser.rank}`;
    document.getElementById('userLevel').textContent = currentUser.level;
}

// Update level buttons based on completed levels
function updateLevelButtons() {
    if (!currentUser) return;
    
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach((btn, index) => {
        const level = index + 1;
        
        // Check if this level is unlocked
        if (currentUser.completedLevels.includes(level)) {
            btn.classList.add('unlocked');
            btn.classList.remove('locked');
            btn.disabled = false;
        } else {
            btn.classList.add('locked');
            btn.classList.remove('unlocked');
            btn.disabled = true;
        }
    });
}

// Select game level
function selectLevel(level) {
    if (!currentUser) {
        alert('Please sign in first!');
        showSection('login');
        return;
    }
    
    // Check if level is unlocked
    if (!currentUser.completedLevels.includes(level)) {
        alert('Complete previous levels to unlock this one!');
        return;
    }
    
    currentLevel = level;
    
    // Update UI
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach(btn => {
        if (btn.classList.contains('unlocked')) {
            btn.classList.remove('active');
        }
    });
    
    const selectedButton = document.querySelector(`.level-btn[data-level="${level}"]`);
    if (selectedButton && selectedButton.classList.contains('unlocked')) {
        selectedButton.classList.add('active');
    }
    
    document.querySelector('.level-title').textContent = `Level ${level}`;
}

// Play game
function playGame() {
    if (!currentUser) {
        alert('Please sign in first!');
        showSection('login');
        return;
    }
    
    // Simulate game play and completion
    const points = Math.floor(Math.random() * 100) + 50;
    currentUser.score += points;
    
    // Mark current level as completed and unlock next level
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 5 && !currentUser.completedLevels.includes(nextLevel)) {
        currentUser.completedLevels.push(nextLevel);
        currentUser.level = nextLevel;
        
        alert(`🎉 Congratulations! You completed Level ${currentLevel} and earned ${points} points!\n\nLevel ${nextLevel} is now unlocked!`);
    } else {
        alert(`Great job! You earned ${points} points!`);
    }
    
    // Update everything
    updateLeaderboard();
    updateProfileView();
    updateLevelButtons();
    updateStats();
}

// Display users
function displayUsers() {
    const usersGrid = document.getElementById('usersGrid');
    usersGrid.innerHTML = '';
    
    if (users.length === 0) {
        usersGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No users registered yet.</p>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}">
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <p style="color: #2a5298; font-weight: bold; margin-top: 10px;">Score: ${user.score}</p>
            <p style="color: #666; font-size: 12px;">Level: ${user.level}</p>
        `;
        usersGrid.appendChild(userCard);
    });
}

// Update leaderboard
function updateLeaderboard() {
    // Sort users by score
    leaderboard = [...users].sort((a, b) => b.score - a.score);
    
    // Update ranks
    leaderboard.forEach((user, index) => {
        user.rank = index + 1;
    });
}

// Display leaderboard
function displayLeaderboard() {
    updateLeaderboard();
    
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: #666;">No players on the leaderboard yet.</p>';
        return;
    }
    
    leaderboard.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        let rankClass = '';
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';
        
        item.innerHTML = `
            <div class="rank-badge ${rankClass}">${index + 1}</div>
            <div class="player-info">
                <h3>${player.name}</h3>
                <p>Level ${player.level}</p>
            </div>
            <div class="player-score">${player.score}</div>
        `;
        
        leaderboardList.appendChild(item);
    });
}

// Update stats
function updateStats() {
    const totalUsers = users.length;
    const activePlayers = users.filter(u => u.score > 0).length;
    const gamesCompleted = users.reduce((sum, u) => sum + (u.level - 1), 0);
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activePlayers').textContent = activePlayers;
    document.getElementById('gamesCompleted').textContent = gamesCompleted;
}

// Add smooth scrolling behavior
document.addEventListener('DOMContentLoaded', () => {
    // Add click animations to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            }
        });
    });
    
    // Add hover effect to form inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = '';
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + H for Home
    if (e.altKey && e.key === 'h') {
        showSection('home');
    }
    // Alt + L for Login
    else if (e.altKey && e.key === 'l') {
        showSection('login');
    }
    // Alt + R for Register
    else if (e.altKey && e.key === 'r') {
        showSection('register');
    }
    // Alt + G for Game
    else if (e.altKey && e.key === 'g') {
        showSection('game');
    }
    // Alt + E for Events
    else if (e.altKey && e.key === 'e') {
        showSection('events');
    }
});

// Add window resize handler for responsive particles
window.addEventListener('resize', () => {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = '';
    createParticles();
});

// Prevent form submission on Enter key for better UX
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const form = e.target.closest('form');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }
});