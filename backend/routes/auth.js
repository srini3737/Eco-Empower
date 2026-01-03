const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        req.role = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    email,
                    password_hash: passwordHash,
                    role: 'user'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Create wallet for user
        await supabase
            .from('wallets')
            .insert([
                {
                    user_id: newUser.id,
                    balance: 0
                }
            ]);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, role, created_at')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
