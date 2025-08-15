// DOM Elements
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showSignin = document.getElementById('showSignin');
const signinFormEl = document.getElementById('signin-form');
const signupFormEl = document.getElementById('signup-form');

// Form Switching
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    signinFormEl.classList.remove('form-active');
    signinFormEl.classList.add('form-hidden');
    signupFormEl.classList.remove('form-hidden');
    signupFormEl.classList.add('form-active');
});

showSignin.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormEl.classList.remove('form-active');
    signupFormEl.classList.add('form-hidden');
    signinFormEl.classList.remove('form-hidden');
    signinFormEl.classList.add('form-active');
});

// Sign In Form Submission
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    
    try {
        // In a real app, this would make an API call to authenticate
        // For this demo, we'll simulate a successful login
        if (email && password) {
            // Store user data in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                email: email,
                firstName: email.split('@')[0],
                isLoggedIn: true
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Please enter both email and password');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
        console.error('Login error:', error);
    }
});

// Sign Up Form Submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Basic validation
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        // In a real app, this would make an API call to create a user
        // For this demo, we'll simulate successful registration
        if (firstName && lastName && email && password) {
            // Store user data in localStorage
            const userData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                isLoggedIn: true,
                createdAt: new Date().toISOString()
            };
            
            // Store in localStorage
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Also store in a "database" (simulated with localStorage)
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Registration failed. Please try again.');
        console.error('Registration error:', error);
    }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.isLoggedIn) {
        // If user is already logged in, redirect to dashboard
        if (window.location.pathname.includes('signin.html')) {
            window.location.href = 'dashboard.html';
        }
    }
});