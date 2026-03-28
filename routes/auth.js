const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, admin } = require('../config/database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, dateOfBirth, country } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        // Check if user already exists
        const existingSnap = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!existingSnap.empty) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user document
        const userRef = await db.collection('users').add({
            email,
            password_hash: passwordHash,
            full_name: fullName,
            date_of_birth: dateOfBirth || null,
            country: country || null,
            signup_date: admin.firestore.FieldValue.serverTimestamp(),
            last_login: null,
            is_active: true,
            profile_picture_url: null
        });

        // Create default settings
        await db.collection('user_settings').doc(userRef.id).set({
            user_id: userRef.id,
            theme: 'light',
            notifications_enabled: true,
            email_notifications: true,
            daily_reminder_time: '09:00:00',
            data_sharing: false
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: userRef.id, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userRef.id,
                email,
                fullName,
                signupDate: new Date()
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const usersSnap = await db.collection('users')
            .where('email', '==', email)
            .where('is_active', '==', true)
            .limit(1)
            .get();

        if (usersSnap.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userDoc = usersSnap.docs[0];
        const user = userDoc.data();

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await userDoc.ref.update({ last_login: admin.firestore.FieldValue.serverTimestamp() });

        // Generate JWT token
        const token = jwt.sign(
            { userId: userDoc.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: userDoc.id,
                email: user.email,
                fullName: user.full_name,
                signupDate: user.signup_date?.toDate?.() || user.signup_date
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userDoc = await db.collection('users').doc(decoded.userId).get();

        if (!userDoc.exists || !userDoc.data().is_active) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = userDoc.data();

        res.json({
            valid: true,
            user: {
                id: userDoc.id,
                email: user.email,
                fullName: user.full_name,
                signupDate: user.signup_date?.toDate?.() || user.signup_date
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
