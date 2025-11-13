import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { GAMES, isGameCompleted, completeGame, showLevelUpNotification } from './level-manager.js';

let currentUser = null;
let challengeCount = 0;
const CHALLENGES_REQUIRED = 5; // User needs to complete 5 challenges to finish the game

const truths = [
    "What's the most embarrassing thing you've done in college?",
    "Who was your first crush?",
    "What's the biggest lie you've ever told?",
    "What's your most embarrassing moment in a class?",
    "Have you ever cheated on a test?",
    "What's the weirdest dream you've ever had?",
    "Who in this group would you trust with your biggest secret?",
    "What's something you've done that you're not proud of?",
    "Have you ever had a crush on a teacher or professor?",
    "What's the most childish thing you still do?",
    "What's your biggest fear?",
    "Have you ever stalked someone on social media?",
    "What's the worst gift you've ever received?",
    "What's something you've never told your parents?",
    "Who's the last person you stalked on Instagram?"
];

const dares = [
    "Do your best impression of a professor teaching!",
    "Sing the national anthem in a funny voice!",
    "Do 20 push-ups right now!",
    "Dance without music for 1 minute!",
    "Text your crush 'Hey, what's up?'",
    "Post an embarrassing selfie on social media!",
    "Speak in an accent for the next 10 minutes!",
    "Let someone go through your phone for 1 minute!",
    "Do a handstand or try to for 30 seconds!",
    "Eat a spoonful of a condiment of the group's choice!",
    "Call a random contact and sing 'Happy Birthday' to them!",
    "Do your best celebrity impression!",
    "Wear your clothes backward for the next hour!",
    "Let the group give you a new hairstyle!",
    "Do the chicken dance!",
    "Speak only in rhymes for the next 5 minutes!",
    "Do 10 cartwheels in a row!",
    "Try to lick your elbow for 30 seconds!"
];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    // Check if user has already completed this game
    const alreadyCompleted = await isGameCompleted(user.uid, GAMES.TRUTH_DARE);
    if (alreadyCompleted) {
        alert('🎉 You have already completed Truth or Dare!\n\nYou can only play each game once. Your score has been recorded.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Update challenge counter display
    updateChallengeCounter();
});

document.getElementById('truthBtn').addEventListener('click', () => showChallenge('truth'));
document.getElementById('dareBtn').addEventListener('click', () => showChallenge('dare'));
document.getElementById('nextBtn').addEventListener('click', hideChallenge);

function updateChallengeCounter() {
    // Add counter display if it doesn't exist
    let counter = document.querySelector('.challenge-counter');
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'challenge-counter';
        counter.style.cssText = 'text-align: center; margin: 20px 0; font-size: 1.2em; color: #2c3e50;';
        document.querySelector('.choice-buttons').insertAdjacentElement('beforebegin', counter);
    }
    counter.innerHTML = `<strong>Challenges Completed: ${challengeCount}/${CHALLENGES_REQUIRED}</strong>`;
}

async function completeGameIfDone() {
    if (challengeCount >= CHALLENGES_REQUIRED && currentUser) {
        try {
            // Calculate a simple score based on completion (100 points for finishing)
            const score = 100;
            const levelResult = await completeGame(currentUser.uid, GAMES.TRUTH_DARE, score);
            
            alert('🎉 Congratulations!\n\nYou completed Truth or Dare!\nYou earned 100 points!');
            
            // Show level up notification if user leveled up
            if (levelResult.leveledUp) {
                setTimeout(() => {
                    showLevelUpNotification(levelResult.currentLevel);
                }, 500);
            }
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } catch (error) {
            console.error('Error completing game:', error);
        }
    }
}

function showChallenge(type) {
    const challengeCard = document.getElementById('challengeCard');
    const challengeType = document.getElementById('challengeType');
    const challengeText = document.getElementById('challengeText');
    
    if (type === 'truth') {
        const truth = truths[Math.floor(Math.random() * truths.length)];
        challengeType.textContent = '🤔 TRUTH';
        challengeType.style.color = '#3498db';
        challengeText.textContent = truth;
    } else {
        const dare = dares[Math.floor(Math.random() * dares.length)];
        challengeType.textContent = '🔥 DARE';
        challengeType.style.color = '#e74c3c';
        challengeText.textContent = dare;
    }
    
    document.querySelector('.choice-buttons').style.display = 'none';
    challengeCard.style.display = 'block';
    challengeCard.style.animation = 'slideIn 0.5s ease';
}

function hideChallenge() {
    const challengeCard = document.getElementById('challengeCard');
    challengeCard.style.animation = 'slideOut 0.3s ease';
    
    // Increment challenge count
    challengeCount++;
    updateChallengeCounter();
    
    setTimeout(() => {
        challengeCard.style.display = 'none';
        document.querySelector('.choice-buttons').style.display = 'flex';
        
        // Check if game is complete
        completeGameIfDone();
    }, 300);
}
