const User = require('../models/User');

const authController = {
    // Show login form
    showLogin: (req, res) => {
        res.render('auth/login', { 
            title: 'Login',
            error: req.flash('error'),
            success: req.flash('success')
        });
    },

    // Show registration form
    showRegister: (req, res) => {
        res.render('auth/register', { 
            title: 'Register',
            error: req.flash('error'),
            success: req.flash('success')
        });
    },

    // Handle login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findByEmail(email);
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/auth/login');
            }

            // Verify password
            const isValid = await User.verifyPassword(password, user.password);
            if (!isValid) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/auth/login');
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            
            req.flash('success', 'Login successful');
            res.redirect('/');
        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'An error occurred during login');
            res.redirect('/auth/login');
        }
    },

    // Handle registration
    register: async (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;

            // Validate password match
            if (password !== confirmPassword) {
                req.flash('error', 'Passwords do not match');
                return res.redirect('/auth/register');
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                req.flash('error', 'Email already registered');
                return res.redirect('/auth/register');
            }

            // Create new user
            const userId = await User.create({
                username,
                email,
                password
            });

            req.flash('success', 'Registration successful. Please login.');
            res.redirect('/auth/login');
        } catch (error) {
            console.error('Registration error:', error);
            req.flash('error', 'An error occurred during registration');
            res.redirect('/auth/register');
        }
    },

    // Handle logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/auth/login');
        });
    }
};

module.exports = authController;
