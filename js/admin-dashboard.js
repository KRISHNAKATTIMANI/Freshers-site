import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    serverTimestamp,
    query,
    orderBy,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = 'krishnakattimanimb@gmail.com';
let currentDeleteUserId = null;
let currentLeaderboardFilter = 'score';

// Check authentication and admin access
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verify admin email
    if (user.email !== ADMIN_EMAIL) {
        alert('Access Denied: You do not have admin privileges.');
        await signOut(auth);
        window.location.href = 'index.html';
        return;
    }
    
    // Display admin email
    document.getElementById('adminEmail').textContent = user.email;
    
    // Load initial data
    await loadCurrentEvents();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
});

// Section Management
window.showUpdateEvent = function() {
    hideAllSections();
    document.getElementById('updateEventSection').style.display = 'block';
    loadCurrentEvents();
};

window.showUsers = function() {
    hideAllSections();
    document.getElementById('usersSection').style.display = 'block';
    loadUsers();
};

window.showTopPlayers = function() {
    hideAllSections();
    document.getElementById('topPlayersSection').style.display = 'block';
    loadLeaderboard('score');
};

window.closeSection = function(sectionId) {
    document.getElementById(sectionId).style.display = 'none';
};

function hideAllSections() {
    document.getElementById('updateEventSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('topPlayersSection').style.display = 'none';
}

// Event Management
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const eventDescription = document.getElementById('eventDescription').value.trim();
    
    if (!eventName || !eventDate || !eventTime) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        await addDoc(collection(db, 'events'), {
            name: eventName,
            date: eventDate,
            time: eventTime,
            description: eventDescription,
            createdAt: serverTimestamp()
        });
        
        alert('Event created successfully!');
        document.getElementById('eventForm').reset();
        await loadCurrentEvents();
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Error creating event: ' + error.message);
    }
});

async function loadCurrentEvents() {
    const eventsContainer = document.getElementById('currentEvents');
    
    try {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        
        if (eventsSnapshot.empty) {
            eventsContainer.innerHTML = '<p style="color: #999; text-align: center;">No events found</p>';
            return;
        }
        
        let eventsHTML = '';
        eventsSnapshot.forEach((doc) => {
            const event = doc.data();
            eventsHTML += `
                <div class="event-item">
                    <h4>${event.name}</h4>
                    <p><i class="fas fa-calendar"></i> ${event.date} at ${event.time}</p>
                    ${event.description ? `<p><i class="fas fa-info-circle"></i> ${event.description}</p>` : ''}
                    <div class="event-actions">
                        <button class="delete-event-btn" onclick="deleteEvent('${doc.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        eventsContainer.innerHTML = eventsHTML;
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = '<p style="color: #ff6b6b;">Error loading events</p>';
    }
}

window.deleteEvent = async function(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'events', eventId));
        alert('Event deleted successfully!');
        await loadCurrentEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event: ' + error.message);
    }
};

// Users Management
async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading users...</td></tr>';
    
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        if (usersSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No users found</td></tr>';
            return;
        }
        
        let usersHTML = '';
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            // Skip admin user
            if (user.email === ADMIN_EMAIL) {
                return;
            }
            
            const completedGames = user.completedGames || [];
            usersHTML += `
                <tr>
                    <td><strong>${user.displayName || 'N/A'}</strong></td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 5px; font-weight: 600;">${user.level || 0}</span></td>
                    <td><strong>${user.totalScore || 0}</strong></td>
                    <td>${user.gamesPlayed || 0}</td>
                    <td>${completedGames.length}/5</td>
                    <td>
                        <div class="user-actions">
                            <button class="view-btn" onclick="viewUserDetails('${doc.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="delete-user-btn" onclick="openDeleteModal('${doc.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = usersHTML || '<tr><td colspan="7" style="text-align: center; color: #999;">No users found</td></tr>';
    } catch (error) {
        console.error('Error loading users:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ff6b6b;">Error loading users</td></tr>';
    }
}

window.viewUserDetails = async function(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const user = userDoc.data();
            const completedGames = user.completedGames || [];
            
            alert(`User Details:\n\n` +
                  `Name: ${user.displayName || 'N/A'}\n` +
                  `Email: ${user.email}\n` +
                  `Level: ${user.level || 0}\n` +
                  `Total Score: ${user.totalScore || 0}\n` +
                  `Games Played: ${user.gamesPlayed || 0}\n` +
                  `Completed Games: ${completedGames.join(', ') || 'None'}\n` +
                  `Created: ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}`
            );
        }
    } catch (error) {
        console.error('Error viewing user:', error);
        alert('Error loading user details');
    }
};

window.openDeleteModal = function(userId) {
    currentDeleteUserId = userId;
    document.getElementById('deleteModal').classList.add('active');
};

window.closeDeleteModal = function() {
    currentDeleteUserId = null;
    document.getElementById('deleteModal').classList.remove('active');
};

window.confirmDelete = async function() {
    if (!currentDeleteUserId) return;
    
    try {
        // Check if trying to delete admin
        const userDoc = await getDoc(doc(db, 'users', currentDeleteUserId));
        if (userDoc.exists() && userDoc.data().email === 'krishnakattimanimb@gmail.com') {
            alert('Cannot delete admin account!');
            closeDeleteModal();
            return;
        }
        
        await deleteDoc(doc(db, 'users', currentDeleteUserId));
        alert('✅ User deleted successfully!');
        closeDeleteModal();
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.code === 'permission-denied') {
            alert('⚠️ Permission Denied!\n\nPlease update Firestore security rules:\n1. Go to Firebase Console\n2. Navigate to Firestore Database > Rules\n3. Copy rules from firestore.rules file\n4. Publish the rules');
        } else {
            alert('❌ Error deleting user: ' + error.message);
        }
        closeDeleteModal();
    }
};

// Search Users
document.getElementById('userSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Leaderboard
window.filterLeaderboard = function(filter) {
    currentLeaderboardFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadLeaderboard(filter);
};

async function loadLeaderboard(filter = 'score') {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div class="loading">Loading leaderboard...</div>';
    
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        if (usersSnapshot.empty) {
            leaderboardList.innerHTML = '<p style="text-align: center; color: #999;">No players found</p>';
            return;
        }
        
        // Collect users and filter out admin
        let users = [];
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            if (user.email !== ADMIN_EMAIL) {
                users.push({
                    id: doc.id,
                    ...user
                });
            }
        });
        
        // Sort based on filter
        if (filter === 'score') {
            users.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        } else if (filter === 'level') {
            users.sort((a, b) => (b.level || 0) - (a.level || 0));
        } else if (filter === 'games') {
            users.sort((a, b) => (b.gamesPlayed || 0) - (a.gamesPlayed || 0));
        }
        
        // Display only top 20
        users = users.slice(0, 20);
        
        let leaderboardHTML = '';
        users.forEach((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            let statValue, statLabel;
            if (filter === 'score') {
                statValue = user.totalScore || 0;
                statLabel = 'Total Score';
            } else if (filter === 'level') {
                statValue = user.level || 0;
                statLabel = 'Level';
            } else {
                statValue = user.gamesPlayed || 0;
                statLabel = 'Games Played';
            }
            
            leaderboardHTML += `
                <div class="leaderboard-item ${rankClass}">
                    <div class="rank">#${rank}</div>
                    <div class="player-info">
                        <h3>${user.displayName || 'Anonymous'}</h3>
                        <p>${user.email}</p>
                    </div>
                    <div class="player-stats">
                        <div class="stat-value">${statValue}</div>
                        <div class="stat-label">${statLabel}</div>
                    </div>
                </div>
            `;
        });
        
        leaderboardList.innerHTML = leaderboardHTML || '<p style="text-align: center; color: #999;">No players found</p>';
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Error loading leaderboard</p>';
    }
}
