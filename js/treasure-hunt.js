import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GAMES, isGameCompleted, completeGame, showLevelUpNotification } from './level-manager.js';

let currentUser = null;
let currentClueIndex = 0;
let foundLocations = [];

const clues = [
    {
        clue: "Where knowledge begins each day, with chairs in rows and words that stay. Students gather to learn and grow, this place of wisdom you surely know.",
        answer: "CLASSROOM",
        hint: "It has desks and a blackboard"
    },
    {
        clue: "Rows of books from floor to ceiling, a quiet place for thoughtful reading. Whispers echo, students study here, knowledge awaits, crystal clear.",
        answer: "LIBRARY",
        hint: "Shhh! No talking allowed here"
    },
    {
        clue: "Where hunger meets its happy end, with trays and tables, many a friend. The smell of food fills the air, students gather without a care.",
        answer: "CAFETERIA",
        hint: "You eat lunch here"
    },
    {
        clue: "Green grass where games are played, running, jumping in the shade. Laughter echoes, students cheer, physical fun happens here.",
        answer: "PLAYGROUND",
        hint: "Where you play sports"
    },
    {
        clue: "Test tubes, beakers, chemicals galore, experiments happen behind this door. Safety goggles are a must, in this place of scientific trust.",
        answer: "LABORATORY",
        hint: "Science experiments happen here"
    },
    {
        clue: "The heart of campus, open and wide, where students meet from every side. Events and gatherings, day and night, in this central space so bright.",
        answer: "AUDITORIUM",
        hint: "Large hall for events"
    }
];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    
    // Check if user has already completed this game
    const alreadyCompleted = await isGameCompleted(user.uid, GAMES.TREASURE_HUNT);
    if (alreadyCompleted) {
        alert('🎉 You have already completed Treasure Hunt!\n\nYou can only play each game once. Your score has been recorded.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    loadClue();
});

document.getElementById('checkBtn').addEventListener('click', checkLocation);
document.getElementById('hintBtn').addEventListener('click', showHint);

document.getElementById('locationAnswer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkLocation();
    }
});

function loadClue() {
    if (currentClueIndex >= clues.length) {
        completeHunt();
        return;
    }

    const clueData = clues[currentClueIndex];
    document.getElementById('clueNumber').textContent = currentClueIndex + 1;
    document.getElementById('clueText').textContent = clueData.clue;
    document.getElementById('hintText').style.display = 'none';
    document.getElementById('locationAnswer').value = '';
    
    updateProgress();
}

function checkLocation() {
    const answer = document.getElementById('locationAnswer').value.toUpperCase().trim();
    const correctAnswer = clues[currentClueIndex].answer;
    
    if (answer === correctAnswer) {
        foundLocations.push(correctAnswer);
        showSuccess();
        setTimeout(() => {
            currentClueIndex++;
            loadClue();
        }, 2000);
    } else if (answer) {
        showError();
    }
}

function showHint() {
    const hint = clues[currentClueIndex].hint;
    const hintText = document.getElementById('hintText');
    hintText.textContent = hint;
    hintText.style.display = 'block';
}

function showSuccess() {
    const input = document.getElementById('locationAnswer');
    input.style.animation = 'correctPulse 0.5s';
    setTimeout(() => {
        input.style.animation = '';
    }, 500);
}

function showError() {
    const input = document.getElementById('locationAnswer');
    input.style.animation = 'wrongShake 0.5s';
    setTimeout(() => {
        input.style.animation = '';
    }, 500);
}

function updateProgress() {
    const progressDiv = document.getElementById('locationsFound');
    progressDiv.innerHTML = '';
    
    foundLocations.forEach(location => {
        const locationBadge = document.createElement('div');
        locationBadge.className = 'location-badge';
        locationBadge.innerHTML = `<i class="fas fa-check-circle"></i> ${location}`;
        progressDiv.appendChild(locationBadge);
    });
}

async function completeHunt() {
    document.getElementById('clueCard').style.display = 'none';
    document.getElementById('completionCard').style.display = 'block';
    
    const score = foundLocations.length * 20;
    
    if (currentUser) {
        try {
            // Complete game and level up
            const levelResult = await completeGame(currentUser.uid, GAMES.TREASURE_HUNT, score);
            
            // Show level up notification if user leveled up
            if (levelResult.leveledUp) {
                setTimeout(() => {
                    showLevelUpNotification(levelResult.currentLevel);
                }, 500);
            }
        } catch (error) {
            console.error('Error completing game:', error);
        }
    }
}
