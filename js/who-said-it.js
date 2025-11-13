import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GAMES, isGameCompleted, completeGame, showLevelUpNotification } from './level-manager.js';

let currentUser = null;
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;

const quotes = [
    {
        quote: "Be the change you wish to see in the world.",
        author: "Mahatma Gandhi",
        options: ["Mahatma Gandhi", "Martin Luther King Jr.", "Nelson Mandela", "Mother Teresa"]
    },
    {
        quote: "The only thing we have to fear is fear itself.",
        author: "Franklin D. Roosevelt",
        options: ["Franklin D. Roosevelt", "Winston Churchill", "John F. Kennedy", "Abraham Lincoln"]
    },
    {
        quote: "I have a dream that one day this nation will rise up.",
        author: "Martin Luther King Jr.",
        options: ["Martin Luther King Jr.", "Malcolm X", "Rosa Parks", "Barack Obama"]
    },
    {
        quote: "In the end, we will remember not the words of our enemies, but the silence of our friends.",
        author: "Martin Luther King Jr.",
        options: ["Martin Luther King Jr.", "Nelson Mandela", "Mahatma Gandhi", "Desmond Tutu"]
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        options: ["Eleanor Roosevelt", "Marie Curie", "Maya Angelou", "Rosa Parks"]
    },
    {
        quote: "Float like a butterfly, sting like a bee.",
        author: "Muhammad Ali",
        options: ["Muhammad Ali", "Mike Tyson", "Bruce Lee", "Michael Jordan"]
    },
    {
        quote: "Education is the most powerful weapon which you can use to change the world.",
        author: "Nelson Mandela",
        options: ["Nelson Mandela", "Martin Luther King Jr.", "Mahatma Gandhi", "Barack Obama"]
    },
    {
        quote: "Stay hungry, stay foolish.",
        author: "Steve Jobs",
        options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"]
    },
    {
        quote: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins",
        options: ["Tony Robbins", "Oprah Winfrey", "Steve Jobs", "Richard Branson"]
    },
    {
        quote: "Life is what happens when you're busy making other plans.",
        author: "John Lennon",
        options: ["John Lennon", "Paul McCartney", "Bob Dylan", "Elvis Presley"]
    }
];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    
    // Check if user has already completed this game
    const alreadyCompleted = await isGameCompleted(user.uid, GAMES.WHO_SAID_IT);
    if (alreadyCompleted) {
        alert('🎉 You have already completed Who Said It!\n\nYou can only play each game once. Your score has been recorded.');
        window.location.href = 'dashboard.html';
        return;
    }
});

document.getElementById('startGame').addEventListener('click', () => {
    switchScreen('startScreen', 'gameScreen');
    startGame();
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
    updateScore();
    loadQuestion();
}

function resetGame() {
    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    wrongCount = 0;
}

function loadQuestion() {
    if (currentQuestionIndex >= quotes.length) {
        endGame();
        return;
    }

    const quoteData = quotes[currentQuestionIndex];
    document.getElementById('quoteText').textContent = `"${quoteData.quote}"`;
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quotes.length;
    
    const progress = ((currentQuestionIndex) / quotes.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    const authorsGrid = document.getElementById('authorsGrid');
    authorsGrid.innerHTML = '';
    
    quoteData.options.forEach((author) => {
        const authorCard = document.createElement('div');
        authorCard.className = 'author-card';
        authorCard.innerHTML = `
            <div class="author-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="author-name">${author}</div>
        `;
        authorCard.addEventListener('click', () => selectAuthor(author));
        authorsGrid.appendChild(authorCard);
    });
}

function selectAuthor(selectedAuthor) {
    const quoteData = quotes[currentQuestionIndex];
    const isCorrect = selectedAuthor === quoteData.author;
    
    document.querySelectorAll('.author-card').forEach(card => {
        card.style.pointerEvents = 'none';
        const name = card.querySelector('.author-name').textContent;
        
        if (name === quoteData.author) {
            card.classList.add('correct');
        } else if (name === selectedAuthor && !isCorrect) {
            card.classList.add('wrong');
        }
    });
    
    if (isCorrect) {
        correctCount++;
        score += 10;
        showFeedback(true);
    } else {
        wrongCount++;
        showFeedback(false);
    }
    
    updateScore();
    
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 2000);
}

function showFeedback(isCorrect) {
    const card = document.getElementById('quoteCard');
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = isCorrect ? 'correctPulse 0.5s' : 'wrongShake 0.5s';
    }, 10);
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

async function endGame() {
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('wrongCount').textContent = wrongCount;
    
    const percentage = (correctCount / quotes.length) * 100;
    const resultTitle = document.getElementById('resultTitle');
    
    if (percentage >= 80) {
        resultTitle.textContent = '🎉 Quote Master!';
    } else if (percentage >= 60) {
        resultTitle.textContent = '👏 Well Done!';
    } else if (percentage >= 40) {
        resultTitle.textContent = '👍 Good Try!';
    } else {
        resultTitle.textContent = '💪 Keep Practicing!';
    }
    
    if (currentUser) {
        try {
            // Complete game and level up
            const levelResult = await completeGame(currentUser.uid, GAMES.WHO_SAID_IT, score);
            
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
