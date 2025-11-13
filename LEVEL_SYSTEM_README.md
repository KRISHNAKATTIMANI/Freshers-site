# Level System Implementation Guide

## Overview
The CS MANICZ website now features a level system where each completed game increases the user's level by 1. Each of the 5 games represents one level, so users can reach a maximum of Level 5.

## Features Implemented

### 1. User Profile Level Badge
- **Location**: Dashboard welcome banner
- **Display**: Shows current level with trophy icon
- **Styling**: Animated gradient badge with pulse effect
- **Colors**: Gold trophy icon on purple gradient background

### 2. Level Management System
- **File**: `js/level-manager.js`
- **Functions**:
  - `completeGame(userId, gameId, score)` - Marks a game as complete and upgrades level
  - `getUserLevel(userId)` - Gets user's current level and progress
  - `showLevelUpNotification(newLevel)` - Displays animated level-up notification
  - `isGameCompleted(userId, gameId)` - Checks if a specific game is completed

### 3. Database Structure
Updated Firestore user document with new fields:
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  usn: string,
  photoURL: string,
  createdAt: timestamp,
  totalScore: number,
  gamesPlayed: number,
  level: number,                    // NEW: Current level (0-5)
  completedGames: array,             // NEW: Array of completed game IDs
  isAdmin: boolean
}
```

## Game IDs
Each game has a unique identifier:
- `riddle-rush` - Riddle Rush (Logic MCQs)
- `who-said-it` - Who Said It? (Quote Game)
- `truth-dare` - Truth or Dare
- `word-scramble` - Word Scramble
- `treasure-hunt` - Campus Treasure Hunt

## Implementation in Game Files

### Step 1: Import Level Manager
Add this import at the top of your game's JavaScript file:
```javascript
import { completeGame, GAMES, showLevelUpNotification } from './level-manager.js';
```

### Step 2: Call completeGame() When Game Ends
Replace your score-saving logic with the level system. Example from `riddle-rush.js`:

**Before:**
```javascript
if (currentUser) {
    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            totalScore: increment(score),
            gamesPlayed: increment(1),
            lastPlayed: new Date()
        });
    } catch (error) {
        console.error('Error saving score:', error);
    }
}
```

**After:**
```javascript
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
```

### Step 3: Use Correct Game ID
Replace `GAMES.RIDDLE_RUSH` with the appropriate game constant:
- Riddle Rush: `GAMES.RIDDLE_RUSH`
- Who Said It?: `GAMES.WHO_SAID_IT`
- Truth or Dare: `GAMES.TRUTH_OR_DARE`
- Word Scramble: `GAMES.WORD_SCRAMBLE`
- Treasure Hunt: `GAMES.TREASURE_HUNT`

## How It Works

### First Time Playing a Game
1. User completes a game
2. `completeGame()` is called with userId, gameId, and score
3. Game ID is added to `completedGames` array
4. User's `level` is incremented by 1
5. `totalScore` and `gamesPlayed` are updated
6. Level-up notification appears with animation
7. Dashboard updates to show new level

### Replaying a Completed Game
1. User completes a game they've already played
2. `completeGame()` checks if game is in `completedGames` array
3. If already completed, only updates `totalScore` and `gamesPlayed`
4. Level remains the same (no duplicate level-ups)
5. Returns `leveledUp: false` in response

## Level Up Notification
- **Position**: Center of screen
- **Animation**: Scale and fade-in effect
- **Duration**: 4 seconds
- **Content**: Trophy icon, "Level Up!" message, new level number
- **Styling**: Purple gradient background with confetti emojis

## Dashboard Display
The level badge appears in the welcome banner:
```html
<div class="level-badge">
    <i class="fas fa-trophy"></i>
    <span>Level <span id="userLevel">0</span></span>
</div>
```

## CSS Classes
- `.level-badge` - The main badge container
- `.level-up-notification` - Notification overlay
- `.level-up-content` - Content inside notification
- Animation classes: `levelPulse`, `trophyBounce`, `confettiFloat`

## Testing the System

### Test New User Registration
1. Register a new user
2. Check Firebase: `level` should be 0, `completedGames` should be []
3. Dashboard should show "Level 0"

### Test Game Completion
1. Complete Riddle Rush
2. Level should upgrade to 1
3. Check Firebase: `level` = 1, `completedGames` = ['riddle-rush']
4. Dashboard should show "Level 1"

### Test Game Replay
1. Play Riddle Rush again
2. Level should remain at 1 (no duplicate level-up)
3. Score should still be added to totalScore

### Test All Games
1. Complete all 5 games in sequence
2. Final level should be 5
3. `completedGames` array should have all 5 game IDs

## Files Modified
1. `js/auth.js` - Added level and completedGames fields to new user creation
2. `dashboard.html` - Added level badge to welcome banner
3. `css/dashboard.css` - Added styling for level badge and notification
4. `js/dashboard.js` - Added level display logic
5. `js/riddle-rush.js` - Implemented level system (example)

## Files Created
1. `js/level-manager.js` - Complete level management system

## TODO: Implement in Remaining Games
Apply the same pattern to these game files:
- [ ] `js/who-said-it.js`
- [ ] `js/truth-dare.js`
- [ ] `js/word-scramble.js`
- [ ] `js/treasure-hunt.js`

## Future Enhancements (Optional)
- Add level-based rewards or achievements
- Display progress bar showing X/5 games completed
- Add special badges for completing all games
- Leaderboard sorting by level
- Unlock special features at certain levels
- Add level icons/themes for each game type
