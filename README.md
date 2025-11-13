# CS MANICZ - Freshers Party Website 🎉

A beautiful, interactive website for college freshers with authentication and multiple games!

## ✨ Features

- 🔐 **Firebase Authentication**
  - Google Sign-in
  - Email/Password authentication
  - User profile management

- 🎮 **Interactive Games**
  1. **Riddle Rush** - Logic-based MCQ game with timer
  2. **Who Said It?** - Match famous quotes with their authors
  3. **Truth or Dare** - Classic party game
  4. **Word Scramble** - Unscramble words against time
  5. **Campus Treasure Hunt** - Clue-based location finding game

- 💾 **Firebase Firestore Integration**
  - User data storage
  - Score tracking
  - Leaderboard system
  - Game statistics

- 🎨 **Beautiful UI/UX**
  - Smooth animations
  - Gradient backgrounds
  - Particle effects
  - Responsive design
  - Modern card-based layouts

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Firebase account
- Web server (Live Server, http-server, or similar)

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google and Email/Password providers
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Start collection named "users"

### Installation

1. Your Firebase configuration is already set up in `js/firebase-config.js`

2. Open the project with a local web server:
   - Using VS Code Live Server: Right-click `index.html` > Open with Live Server
   - Using Python: `python -m http.server 8000`
   - Using Node.js: `npx http-server`

3. Navigate to the local URL (e.g., `http://localhost:8000`)

## 📁 Project Structure

```
Freshers_site/
├── index.html                 # Login/Registration page
├── dashboard.html             # Main dashboard
├── games.html                 # Games selection page
├── admin.html                 # Admin panel
├── riddle-rush.html          # Riddle Rush game
├── who-said-it.html          # Who Said It game
├── truth-dare.html           # Truth or Dare game
├── word-scramble.html        # Word Scramble game
├── treasure-hunt.html        # Treasure Hunt game
├── css/
│   ├── style.css             # Login page styles
│   ├── dashboard.css         # Dashboard styles
│   ├── games.css             # Games page styles
│   ├── admin.css             # Admin panel styles
│   ├── riddle-rush.css       # Riddle Rush styles
│   ├── who-said-it.css       # Who Said It styles
│   ├── truth-dare.css        # Truth or Dare styles
│   ├── word-scramble.css     # Word Scramble styles
│   └── treasure-hunt.css     # Treasure Hunt styles
└── js/
    ├── firebase-config.js    # Firebase configuration
    ├── auth.js               # Authentication logic
    ├── dashboard.js          # Dashboard logic
    ├── games.js              # Games page logic
    ├── admin.js              # Admin panel logic
    ├── riddle-rush.js        # Riddle Rush game logic
    ├── who-said-it.js        # Who Said It logic
    ├── truth-dare.js         # Truth or Dare logic
    ├── word-scramble.js      # Word Scramble logic
    └── treasure-hunt.js      # Treasure Hunt logic
```

## 🎮 How to Play

1. **Sign Up/Login** - Use Google Sign-in or email/password
2. **Choose a Game** - Select from the dashboard or games page
3. **Play and Score** - Complete challenges to earn points
4. **Check Leaderboard** - See top players on the dashboard

## 🔒 Firestore Security Rules

Add these security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌟 Features Overview

### Authentication
- Beautiful animated login/registration page
- Google OAuth integration
- Email/password authentication
- Persistent sessions

### Games

**Riddle Rush**
- 10 challenging riddles
- 120-second timer per riddle
- Points system with time bonus
- Animated feedback

**Who Said It?**
- Match quotes with famous people
- Multiple choice format
- Famous quotes from history and culture

**Truth or Dare**
- Random truth questions
- Fun dare challenges
- Instant generation

**Word Scramble**
- Unscramble 10 words
- 60-second total timer
- Hints provided
- Real-time scoring

**Campus Treasure Hunt**
- Location-based clues
- Progressive difficulty
- Hint system
- Completion rewards

### Leaderboard
- Real-time score updates
- Top 10 players display
- Total score tracking
- Games played statistics

## 🎨 Customization

You can easily customize:
- Colors in CSS files (gradient backgrounds)
- Game questions/content in JS files
- Number of questions per game
- Scoring system
- Timer durations

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🛠️ Technologies Used

- HTML5
- CSS3 (with animations)
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Font Awesome Icons

## 🤝 Contributing

Feel free to fork this project and add more games or features!

## 📝 License

This project is open source and available for educational purposes.

## 🎉 Have Fun!

Enjoy playing the games and competing with your friends!

---

Made with ❤️ for College Freshers
