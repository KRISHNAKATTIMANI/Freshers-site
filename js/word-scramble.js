import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GAMES, isGameCompleted, completeGame, showLevelUpNotification } from './level-manager.js';

let currentUser = null;
let currentWordIndex = 0;
let score = 0;
let correctCount = 0;
let timer = 60;
let timerInterval = null;

const words = [
    { word: "COMPUTER", hint: "Electronic device" },
    { word: "JAVASCRIPT", hint: "Programming language" },
    { word: "COLLEGE", hint: "Educational institution" },
    { word: "ALGORITHM", hint: "Step-by-step procedure" },
    { word: "DATABASE", hint: "Collection of data" },
    { word: "NETWORK", hint: "Connected systems" },
    { word: "FUNCTION", hint: "Block of code" },
    { word: "VARIABLE", hint: "Data container" },
    { word: "KEYBOARD", hint: "Input device" },
    { word: "BROWSER", hint: "Internet application" }
];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    
    // Check if user has already completed this game
    const alreadyCompleted = await isGameCompleted(user.uid, GAMES.WORD_SCRAMBLE);
    if (alreadyCompleted) {
        alert('🎉 You have already completed Word Scramble!\n\nYou can only play each game once. Your score has been recorded.');
        window.location.href = 'dashboard.html';
        return;
    }
});

document.getElementById('startGame').addEventListener('click', () => {
    switchScreen('startScreen', 'gameScreen');
    startGame();
});

document.getElementById('submitBtn').addEventListener('click', checkAnswer);
document.getElementById('skipBtn').addEventListener('click', skipWord);

document.getElementById('answerInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

function switchScreen(from, to) {
    document.getElementById(from).classList.remove('active');
    setTimeout(() => {
        document.getElementById(to).classList.add('active');
    }, 300);
}

function startGame() {
    currentWordIndex = 0;
    score = 0;
    correctCount = 0;
    updateScore();
    loadWord();
    startTimer();
}

function resetGame() {
    clearInterval(timerInterval);
    currentWordIndex = 0;
    score = 0;
    correctCount = 0;
}

function loadWord() {
    if (currentWordIndex >= words.length) {
        endGame();
        return;
    }

    const wordData = words[currentWordIndex];
    const scrambled = scrambleWord(wordData.word);
    
    document.getElementById('scrambledWord').textContent = scrambled;
    document.getElementById('hint').textContent = wordData.hint;
    document.getElementById('currentWord').textContent = currentWordIndex + 1;
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();
}

function scrambleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join(' ');
}

function startTimer() {
    timer = 60;
    document.getElementById('timer').textContent = timer;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = timer;
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function checkAnswer() {
    const answer = document.getElementById('answerInput').value.toUpperCase().trim();
    const correctWord = words[currentWordIndex].word;
    
    if (answer === correctWord) {
        correctCount++;
        score += 10;
        updateScore();
        showFeedback(true);
        setTimeout(() => {
            currentWordIndex++;
            loadWord();
        }, 1000);
    } else if (answer) {
        showFeedback(false);
    }
}

function skipWord() {
    currentWordIndex++;
    loadWord();
}

function showFeedback(isCorrect) {
    const input = document.getElementById('answerInput');
    input.style.animation = 'none';
    setTimeout(() => {
        input.style.animation = isCorrect ? 'correctPulse 0.5s' : 'wrongShake 0.5s';
    }, 10);
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

async function endGame() {
    clearInterval(timerInterval);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctWords').textContent = `${correctCount}/10`;
    
    const percentage = (correctCount / words.length) * 100;
    const resultTitle = document.getElementById('resultTitle');
    
    if (percentage >= 80) {
        resultTitle.textContent = '🎉 Word Master!';
    } else if (percentage >= 60) {
        resultTitle.textContent = '👏 Great Job!';
    } else {
        resultTitle.textContent = '👍 Good Try!';
    }
    
    if (currentUser) {
        try {
            // Complete game and level up
            const levelResult = await completeGame(currentUser.uid, GAMES.WORD_SCRAMBLE, score);
            
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
    
    switchScreen('gameScreen', 'resultScreen');
}
