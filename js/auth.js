import { auth, db } from './firebase-config.js';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'dashboard.html';
    }
});

// Toggle between login and register
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('registerSection').style.display = 'block';
        animateCard();
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
        animateCard();
    });
}

function animateCard() {
    const card = document.getElementById('authCard');
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 100);
}

// Google Sign In
async function googleSignIn() {
    try {
        showLoading();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if admin email
        const ADMIN_EMAIL = 'krishnakattimanimb@gmail.com';
        if (user.email === ADMIN_EMAIL) {
            hideLoading();
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // Save user to Firestore
        await saveUserToFirestore(user);
        
        hideLoading();
        window.location.href = 'dashboard.html';
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Password validation function
function validatePassword(password, name, email) {
    // Common weak passwords and patterns
    const commonPasswords = [
        'password', 'password123', '123456', '12345678', '123456789', '1234567890',
        'qwerty', 'qwertyui', 'qwertyuiop', 'abc123', 'abcd1234', 'password1',
        'letmein', 'welcome', 'monkey', '1234', '12345', '111111', '000000',
        'admin', 'admin123', 'root', 'pass', 'pass123', 'test', 'test123',
        'user', 'user123', 'hello', 'hello123', 'welcome123', 'trustno1',
        'dragon', 'master', 'sunshine', 'princess', 'football', 'shadow',
        'michael', 'jennifer', 'computer', 'baseball', 'jordan', 'harley'
    ];
    
    // 1. Minimum length check (8 characters)
    if (password.length < 8) {
        return {
            valid: false,
            message: 'Password must be at least 8 characters long.'
        };
    }
    
    // 2. Complexity check (at least 3 of 4 categories)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const complexityScore = [hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (complexityScore < 3) {
        return {
            valid: false,
            message: 'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character.'
        };
    }
    
    // 3. No personal info check
    const nameParts = name.toLowerCase().split(' ');
    const emailUsername = email.toLowerCase().split('@')[0];
    const passwordLower = password.toLowerCase();
    
    // Check if password contains name parts (longer than 2 chars)
    for (const part of nameParts) {
        if (part.length > 2 && passwordLower.includes(part)) {
            return {
                valid: false,
                message: 'Password cannot contain your name.'
            };
        }
    }
    
    // Check if password contains email username
    if (emailUsername.length > 3 && passwordLower.includes(emailUsername)) {
        return {
            valid: false,
            message: 'Password cannot contain your email address.'
        };
    }
    
    // 4. Common passwords check
    if (commonPasswords.includes(passwordLower)) {
        return {
            valid: false,
            message: 'This password is too common. Please choose a stronger password.'
        };
    }
    
    // 5. Simple patterns/sequences check
    const simplePatterns = [
        /^(.)\1+$/, // Repeated character (aaaaaa, 111111)
        /^(01|12|23|34|45|56|67|78|89|90)+/, // Sequential numbers
        /^(ab|bc|cd|de|ef|fg|gh|hi|ij|jk|kl|lm|mn|no|op|pq|qr|rs|st|tu|uv|vw|wx|xy|yz)+/i, // Sequential letters
        /^(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)+/i // Keyboard patterns
    ];
    
    for (const pattern of simplePatterns) {
        if (pattern.test(passwordLower)) {
            return {
                valid: false,
                message: 'Password cannot contain simple patterns or sequences.'
            };
        }
    }
    
    // Check for consecutive identical characters (more than 3)
    if (/(.)\1{3,}/.test(password)) {
        return {
            valid: false,
            message: 'Password cannot contain more than 3 consecutive identical characters.'
        };
    }
    
    // Check for ascending/descending sequences
    for (let i = 0; i < password.length - 3; i++) {
        const charCode1 = password.charCodeAt(i);
        const charCode2 = password.charCodeAt(i + 1);
        const charCode3 = password.charCodeAt(i + 2);
        const charCode4 = password.charCodeAt(i + 3);
        
        // Check ascending
        if (charCode2 === charCode1 + 1 && charCode3 === charCode2 + 1 && charCode4 === charCode3 + 1) {
            return {
                valid: false,
                message: 'Password cannot contain sequential characters (e.g., 1234, abcd).'
            };
        }
        
        // Check descending
        if (charCode2 === charCode1 - 1 && charCode3 === charCode2 - 1 && charCode4 === charCode3 - 1) {
            return {
                valid: false,
                message: 'Password cannot contain sequential characters (e.g., 4321, dcba).'
            };
        }
    }
    
    return {
        valid: true,
        message: 'Password is strong!'
    };
}

// Email Registration
document.getElementById('emailRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    console.log('🔍 FORM VALUES CAPTURED:');
    console.log('Name input value:', name);
    console.log('Email input value:', email);
    
    // Strict validation for critical fields
    if (!name || name.trim().length < 3) {
        console.error('❌ Name validation failed:', name);
        showError('Please enter your full name (minimum 3 characters)');
        return;
    }
    
    if (!email || !email.includes('@')) {
        console.error('❌ Email validation failed:', email);
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password || password.length < 8) {
        console.error('❌ Password validation failed');
        showError('Please enter a password (minimum 8 characters)');
        return;
    }
    
    console.log('✅ All fields validated successfully');
    console.log('✅ Name:', name);
    console.log('✅ Email:', email);
    
    // Advanced password validation
    const passwordValidation = validatePassword(password, name, email);
    if (!passwordValidation.valid) {
        showError(passwordValidation.message);
        return;
    }
    
    try {
        showLoading();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('User created successfully:', user.uid);
        console.log('Name to save:', name);
        console.log('Email to save:', email);
        
        // Save user to Firestore with name
        await saveUserToFirestore(user, name);
        
        console.log('User data saved to Firestore successfully');
        console.log('Redirecting to dashboard...');
        
        hideLoading();
        window.location.href = 'dashboard.html';
    } catch (error) {
        hideLoading();
        console.error('❌ Registration error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password does not meet security requirements.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/Password authentication is not enabled. Please contact the administrator.';
            console.error('Firebase Admin: Enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method');
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.code === 'permission-denied') {
            errorMessage = '⚠️ Firestore Permission Error\n\nCannot save user data to database.\nPlease configure Firestore security rules.\n\nCheck FIRESTORE_RULES_FIX.md for instructions.';
        } else if (error.message) {
            errorMessage = 'Registration error: ' + error.message;
        }
        
        showError(errorMessage);
    }
});

// Email Login
document.getElementById('emailLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check if admin credentials
    const ADMIN_EMAIL = 'krishnakattimanimb@gmail.com';
    const ADMIN_PASSWORD = 'SUAKSp@2023';
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try {
            showLoading();
            await signInWithEmailAndPassword(auth, email, password);
            hideLoading();
            window.location.href = 'admin-dashboard.html';
            return;
        } catch (error) {
            hideLoading();
            showError(error.message);
            return;
        }
    }
    
    try {
        showLoading();
        await signInWithEmailAndPassword(auth, email, password);
        hideLoading();
        window.location.href = 'dashboard.html';
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
});

// Save user to Firestore
async function saveUserToFirestore(user, displayName = null) {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 SAVING USER TO FIRESTORE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User UID:', user.uid);
        console.log('Display Name to save:', displayName);
        console.log('Email to save:', user.email);
        
        // CRITICAL: Ensure name is not empty
        if (!displayName || displayName.trim() === '') {
            throw new Error('CRITICAL: Display name cannot be empty!');
        }
        
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName.trim(),
                photoURL: user.photoURL || '',
                createdAt: serverTimestamp(),
                totalScore: 0,
                gamesPlayed: 0,
                level: 0,
                completedGames: [],
                isAdmin: false
            };
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💾 USER DATA OBJECT TO SAVE:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(JSON.stringify(userData, null, 2));
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            await setDoc(userRef, userData);
            console.log('✅ User document created successfully in Firestore');
            
            // CRITICAL VERIFICATION: Read back immediately
            const verifyDoc = await getDoc(userRef);
            if (verifyDoc.exists()) {
                const savedData = verifyDoc.data();
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ VERIFICATION - DATA IN FIRESTORE:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Display Name:', savedData.displayName);
                console.log('Email:', savedData.email);
                console.log('Level:', savedData.level);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                // Final check
                if (!savedData.displayName || savedData.displayName === '') {
                    throw new Error('VERIFICATION FAILED: Display name is empty in Firestore!');
                }
                
                console.log('✅✅✅ ALL DATA VERIFIED SUCCESSFULLY ✅✅✅');
            } else {
                throw new Error('VERIFICATION FAILED: Document not found after creation!');
            }
        } else {
            const existingData = userDoc.data();
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('ℹ️ User document already exists');
            console.log('Existing Display Name:', existingData.displayName);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌❌❌ CRITICAL ERROR SAVING USER ❌❌❌');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        throw error; // Re-throw to handle in calling function
    }
}

function showLoading() {
    const registerSection = document.getElementById('registerSection');
    const loginSection = document.getElementById('loginSection');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (registerSection) registerSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'none';
    if (loadingScreen) loadingScreen.style.display = 'block';
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    const registerSection = document.getElementById('registerSection');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    // Show register section by default after loading
    if (registerSection) registerSection.style.display = 'block';
}

function showError(message) {
    alert('Error: ' + message);
}

// Google Sign-In Button Event Listeners
const googleRegisterBtn = document.getElementById('googleRegisterBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', googleSignIn);
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', googleSignIn);
}
