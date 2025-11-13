import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { completeGame, GAMES, showLevelUpNotification, isGameCompleted } from './level-manager.js';

let currentUser = null;
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let timeBonus = 0;
let timer = 60;
let timerInterval = null;

const riddles = [
    {
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        options: ["Echo", "Shadow", "Dream", "Thought"],
        correct: 0
    },
    {
        question: "The more you take, the more you leave behind. What am I?",
        options: ["Memories", "Footsteps", "Photos", "Time"],
        correct: 1
    },
    {
        question: "What has keys but no locks, space but no room, and you can enter but can't go inside?",
        options: ["Piano", "Map", "Keyboard", "House"],
        correct: 2
    },
    {
        question: "I'm tall when I'm young, and I'm short when I'm old. What am I?",
        options: ["Tree", "Candle", "Person", "Building"],
        correct: 1
    },
    {
        question: "What can travel around the world while staying in the corner?",
        options: ["Letter", "Stamp", "Plane", "Internet"],
        correct: 1
    },
    {
        question: "What has a head and a tail but no body?",
        options: ["Snake", "Coin", "Arrow", "River"],
        correct: 1
    },
    {
        question: "What gets wetter the more it dries?",
        options: ["Sponge", "Towel", "Rain", "Mop"],
        correct: 1
    },
    {
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        options: ["Planet", "Map", "Desert", "Painting"],
        correct: 1
    },
    {
        question: "What can you hold in your right hand but never in your left hand?",
        options: ["Your heart", "Your left hand", "Your shadow", "Your phone"],
        correct: 1
    },
    {
        question: "What goes up but never comes down?",
        options: ["Balloon", "Age", "Temperature", "Airplane"],
        correct: 1
    }
];

// Check authentication
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    
    // Check if user has already completed this game
    const alreadyCompleted = await isGameCompleted(user.uid, GAMES.RIDDLE_RUSH);
    if (alreadyCompleted) {
        alert('🎉 You have already completed Riddle Rush!\n\nYou can only play each game once. Your score has been recorded.');
        window.location.href = 'dashboard.html';
        return;
    }
});

// Start Game
document.getElementById('startGame').addEventListener('click', () => {
    switchScreen('startScreen', 'gameScreen');
    startGame();
});

// Skip Button
document.getElementById('skipBtn').addEventListener('click', () => {
    nextQuestion();
});

function switchScreen(from, to) {
    document.getElementById(from).classList.remove('active');
    setTimeout(() => {
        document.getElementById(to).classList.add('active');
    }, 300);
}

function startGame() {
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    wrongCount = 0;
    timeBonus = 0;
    updateScore();
    loadQuestion();
}

function resetGame() {
    clearInterval(timerInterval);
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    wrongCount = 0;
    timeBonus = 0;
}

function loadQuestion() {
    if (currentQuestionIndex >= riddles.length) {
        endGame();
        return;
    }

    const riddle = riddles[currentQuestionIndex];
    document.getElementById('questionText').textContent = riddle.question;
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = riddles.length;
    
    // Update progress bar
    const progress = ((currentQuestionIndex) / riddles.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Load options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    riddle.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        optionBtn.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(optionBtn);
    });

    // Start timer
    startTimer();
}

function startTimer() {
    timer = 60;
    document.getElementById('timer').textContent = timer;
    
    const circle = document.getElementById('timerCircle');
    const circumference = 2 * Math.PI * 45;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = 0;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = timer;
        
        const offset = circumference - (timer / 60) * circumference;
        circle.style.strokeDashoffset = offset;
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            wrongCount++;
            score -= 2;
            updateScore();
            showFeedback(false);
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function selectAnswer(selectedIndex) {
    clearInterval(timerInterval);
    
    const riddle = riddles[currentQuestionIndex];
    const isCorrect = selectedIndex === riddle.correct;
    
    // Disable all buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Show correct/wrong
    const buttons = document.querySelectorAll('.option-btn');
    if (isCorrect) {
        buttons[selectedIndex].classList.add('correct');
        correctCount++;
        score += 10;
        
        // Time bonus
        const bonus = Math.floor(timer / 10);
        timeBonus += bonus;
        score += bonus;
    } else {
        buttons[selectedIndex].classList.add('wrong');
        buttons[riddle.correct].classList.add('correct');
        wrongCount++;
        score -= 2;
    }
    
    updateScore();
    showFeedback(isCorrect);
    
    setTimeout(nextQuestion, 2000);
}

function showFeedback(isCorrect) {
    const card = document.getElementById('questionCard');
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = isCorrect ? 'correctShake 0.5s' : 'wrongShake 0.5s';
    }, 10);
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

async function endGame() {
    clearInterval(timerInterval);
    
    // Update progress bar to 100%
    document.getElementById('progressFill').style.width = '100%';
    
    // Show results
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('wrongAnswers').textContent = wrongCount;
    document.getElementById('timeBonus').textContent = `+${timeBonus}`;
    
    // Show result icon and title based on performance
    const percentage = (correctCount / riddles.length) * 100;
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    
    if (percentage >= 80) {
        resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        resultTitle.textContent = '🎉 Outstanding!';
        resultIcon.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    } else if (percentage >= 60) {
        resultIcon.innerHTML = '<i class="fas fa-medal"></i>';
        resultTitle.textContent = '👏 Great Job!';
        resultIcon.style.background = 'linear-gradient(135deg, #C0C0C0, #808080)';
    } else if (percentage >= 40) {
        resultIcon.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        resultTitle.textContent = '👍 Good Effort!';
        resultIcon.style.background = 'linear-gradient(135deg, #CD7F32, #8B4513)';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-redo"></i>';
        resultTitle.textContent = '💪 Try Again!';
        resultIcon.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    // Save score to Firestore and upgrade level
    if (currentUser) {
        try {
            // Complete the game and upgrade level
            const levelResult = await completeGame(currentUser.uid, GAMES.RIDDLE_RUSH, score);
            
            console.log('Level result:', levelResult);
            
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
