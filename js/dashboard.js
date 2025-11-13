import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const ADMIN_EMAIL = 'krishnakattimanimb@gmail.com';

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Redirect admin to admin dashboard
    if (user.email === ADMIN_EMAIL) {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    currentUser = user;
    
    // Get user data from Firestore
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        let displayName = 'User';
        let userLevel = 0;
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData);
            displayName = userData.displayName || userData.name || 'User';
            userLevel = userData.level || 0;
        } else {
            console.warn('User document does not exist. Creating new document...');
            displayName = user.email?.split('@')[0] || 'User';
            
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
            
            try {
                await setDoc(userDocRef, defaultUserData);
                console.log('User document created successfully');
            } catch (createError) {
                console.error('Error creating user document:', createError);
            }
        }
        
        console.log('Display name set to:', displayName);
        console.log('User level:', userLevel);
        
        // Display user info
        const userNameElement = document.getElementById('userName');
        const welcomeNameElement = document.getElementById('welcomeName');
        const userLevelElement = document.getElementById('userLevel');
        
        if (userNameElement) {
            userNameElement.textContent = displayName;
        }
        if (welcomeNameElement) {
            welcomeNameElement.textContent = displayName;
        }
        if (userLevelElement) {
            userLevelElement.textContent = userLevel;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        document.getElementById('userName').textContent = user.email?.split('@')[0] || 'User';
        document.getElementById('welcomeName').textContent = user.email?.split('@')[0] || 'User';
        document.getElementById('userLevel').textContent = '0';
    }
    
    // Set user avatar with fallback
    const userAvatar = document.getElementById('userAvatar');
    
    if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.onerror = function() { this.src = 'images/default-user.svg'; };
    } else {
        userAvatar.src = 'images/default-user.svg';
    }
    
    // Setup game progression
    await setupGameProgression(user.uid);
    
    // Load events
    await loadEvents();
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

// Load events from Firestore
async function loadEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    
    try {
        const q = query(collection(db, 'events'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            eventsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.75); border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);">
                    <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #555; font-size: 18px;">No events scheduled yet.</p>
                    <p style="color: #777; font-size: 14px; margin-top: 10px;">Check back soon for exciting updates!</p>
                </div>
            `;
            return;
        }
        
        // Sort events in ascending order (earliest first)
        const eventsArray = sortEventsAscending(querySnapshot);
        
        eventsContainer.innerHTML = '';
        
        eventsArray.forEach((eventData) => {
            const data = eventData.data;
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            
            const eventDate = data.date ? (data.date.toDate ? data.date.toDate() : new Date(data.date)) : new Date();
            const eventTime = data.time || '10:00 AM';
            
            eventCard.innerHTML = `
                <div class="event-header">
                    <div class="event-icon">
                        <i class="${data.icon || 'fas fa-calendar-day'}"></i>
                    </div>
                    <div class="event-info">
                        <h3>${data.name || data.title || 'Event'}</h3>
                        <p>${data.description || 'Details coming soon...'}</p>
                    </div>
                </div>
                <div class="event-date-section">
                    <h4>Date</h4>
                    <p>${formatDate(eventDate)}</p>
                </div>
                <div class="event-time-section">
                    <h4>Time</h4>
                    <p>${eventTime}</p>
                    <div class="event-timer" data-event-date="${eventDate.toISOString()}" data-event-time="${eventTime}">
                        <div class="timer-unit">
                            <span class="timer-value days">00</span>
                            <span class="timer-label">Days</span>
                        </div>
                        <div class="timer-unit">
                            <span class="timer-value hours">00</span>
                            <span class="timer-label">Hrs</span>
                        </div>
                        <div class="timer-unit">
                            <span class="timer-value minutes">00</span>
                            <span class="timer-label">Mins</span>
                        </div>
                        <div class="timer-unit">
                            <span class="timer-value seconds">00</span>
                            <span class="timer-label">Secs</span>
                        </div>
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
        
        // Start countdown timers
        startEventTimers();
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.95); border-radius: 20px;">
                <p style="color: #666;">No events available at the moment.</p>
            </div>
        `;
    }
}

// Sort events in ascending order (earliest event first - highest priority)
function sortEventsAscending(querySnapshot) {
    const eventsArray = [];
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const eventDate = data.date ? (data.date.toDate ? data.date.toDate() : new Date(data.date)) : new Date();
        const eventTime = data.time || '10:00 AM';
        
        // Parse time to get full datetime
        const timeParts = eventTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        let eventDateTime = new Date(eventDate);
        
        if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const meridiem = timeParts[3].toUpperCase();
            
            if (meridiem === 'PM' && hours !== 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            eventDateTime.setHours(hours, minutes, 0, 0);
        }
        
        eventsArray.push({
            id: doc.id,
            data: data,
            dateTime: eventDateTime
        });
    });
    
    // Sort by datetime (ascending - earliest first)
    eventsArray.sort((a, b) => a.dateTime - b.dateTime);
    
    return eventsArray;
}

// Format date helper
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Countdown timer functionality
function startEventTimers() {
    const timers = document.querySelectorAll('.event-timer');
    
    timers.forEach(timer => {
        const eventDateStr = timer.getAttribute('data-event-date');
        const eventTimeStr = timer.getAttribute('data-event-time');
        
        if (!eventDateStr) return;
        
        // Parse event datetime
        const eventDate = new Date(eventDateStr);
        const timeParts = eventTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const meridiem = timeParts[3].toUpperCase();
            
            if (meridiem === 'PM' && hours !== 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            eventDate.setHours(hours, minutes, 0, 0);
        }
        
        // Update countdown every second
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = eventDate.getTime() - now;
            
            if (distance < 0) {
                timer.querySelector('.days').textContent = '00';
                timer.querySelector('.hours').textContent = '00';
                timer.querySelector('.minutes').textContent = '00';
                timer.querySelector('.seconds').textContent = '00';
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            timer.querySelector('.days').textContent = String(days).padStart(2, '0');
            timer.querySelector('.hours').textContent = String(hours).padStart(2, '0');
            timer.querySelector('.minutes').textContent = String(minutes).padStart(2, '0');
            timer.querySelector('.seconds').textContent = String(seconds).padStart(2, '0');
        };
        
        // Initial update
        updateTimer();
        
        // Update every second
        setInterval(updateTimer, 1000);
    });
}

// Game Progression System
async function setupGameProgression(userId) {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.error('User document not found');
            return;
        }
        
        const userData = userDoc.data();
        const completedGames = userData.completedGames || [];
        
        console.log('Completed games:', completedGames);
        
        // Game order mapping
        const gameOrder = {
            1: 'riddle-rush',
            2: 'who-said-it',
            3: 'truth-dare',
            4: 'word-scramble',
            5: 'treasure-hunt'
        };
        
        // Get all game cards
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach((card) => {
            const gameId = card.getAttribute('data-game');
            const gameLevel = parseInt(card.getAttribute('data-level'));
            
            // Check if game is completed
            if (completedGames.includes(gameId)) {
                card.classList.add('completed');
            }
            
            // Lock logic: First game always unlocked, rest locked until previous completed
            if (gameLevel === 1) {
                // First game is always unlocked
                card.classList.remove('locked');
            } else {
                // Check if previous game is completed
                const previousGameId = gameOrder[gameLevel - 1];
                if (completedGames.includes(previousGameId)) {
                    // Previous game completed, unlock this game
                    card.classList.remove('locked');
                } else {
                    // Previous game not completed, lock this game
                    card.classList.add('locked');
                    
                    // Prevent navigation
                    card.addEventListener('click', (e) => {
                        e.preventDefault();
                        alert('🔒 This game is locked!\n\nComplete the previous game to unlock.');
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Error setting up game progression:', error);
    }
}
