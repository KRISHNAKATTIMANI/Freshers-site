import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Game IDs for level tracking
 */
export const GAMES = {
    RIDDLE_RUSH: 'riddle-rush',
    WHO_SAID_IT: 'who-said-it',
    TRUTH_OR_DARE: 'truth-dare',
    WORD_SCRAMBLE: 'word-scramble',
    TREASURE_HUNT: 'treasure-hunt'
};

/**
 * Complete a game and upgrade user level
 * @param {string} userId - The user's UID
 * @param {string} gameId - The game identifier
 * @param {number} score - Score earned in the game
 * @returns {Promise<Object>} Updated user data with level info
 */
export async function completeGame(userId, gameId, score = 0) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const completedGames = userData.completedGames || [];
        const currentLevel = userData.level || 0;
        const currentScore = userData.totalScore || 0;
        const gamesPlayed = userData.gamesPlayed || 0;
        
        // Check if game was already completed
        if (completedGames.includes(gameId)) {
            console.log(`Game ${gameId} already completed. Updating score only.`);
            await updateDoc(userRef, {
                totalScore: currentScore + score,
                gamesPlayed: gamesPlayed + 1
            });
            
            return {
                leveledUp: false,
                currentLevel: currentLevel,
                message: 'Score updated! Game already completed.'
            };
        }
        
        // Mark game as completed and level up
        const newLevel = currentLevel + 1;
        const newScore = currentScore + score;
        
        await updateDoc(userRef, {
            level: newLevel,
            totalScore: newScore,
            gamesPlayed: gamesPlayed + 1,
            completedGames: arrayUnion(gameId)
        });
        
        console.log(`🎉 Level Up! User ${userId} completed ${gameId}. New level: ${newLevel}`);
        
        return {
            leveledUp: true,
            currentLevel: newLevel,
            previousLevel: currentLevel,
            message: `🎉 Congratulations! You've reached Level ${newLevel}!`,
            gameId: gameId,
            scoreEarned: score
        };
        
    } catch (error) {
        console.error('Error completing game:', error);
        throw error;
    }
}

/**
 * Get user's current level and progress
 * @param {string} userId - The user's UID
 * @returns {Promise<Object>} User level data
 */
export async function getUserLevel(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const level = userData.level || 0;
        const completedGames = userData.completedGames || [];
        const totalGames = Object.keys(GAMES).length;
        
        return {
            level: level,
            completedGames: completedGames,
            totalGames: totalGames,
            progress: (completedGames.length / totalGames) * 100,
            remainingGames: totalGames - completedGames.length
        };
        
    } catch (error) {
        console.error('Error getting user level:', error);
        throw error;
    }
}

/**
 * Show level up notification
 * @param {number} newLevel - The new level achieved
 */
export function showLevelUpNotification(newLevel) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="level-up-content">
            <i class="fas fa-trophy"></i>
            <h2>Level Up!</h2>
            <p>You've reached <strong>Level ${newLevel}</strong>!</p>
            <div class="confetti">🎉🎊✨</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

/**
 * Check if user has completed a specific game
 * @param {string} userId - The user's UID
 * @param {string} gameId - The game identifier
 * @returns {Promise<boolean>} True if game is completed
 */
export async function isGameCompleted(userId, gameId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return false;
        }
        
        const userData = userDoc.data();
        const completedGames = userData.completedGames || [];
        
        return completedGames.includes(gameId);
        
    } catch (error) {
        console.error('Error checking game completion:', error);
        return false;
    }
}
