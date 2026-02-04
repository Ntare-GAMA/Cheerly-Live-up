const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await promisePool.query(
            `SELECT u.id, u.email, u.full_name, u.date_of_birth, u.country, 
                    u.signup_date, u.last_login, u.profile_picture_url,
                    s.theme, s.notifications_enabled, s.email_notifications, 
                    s.daily_reminder_time, s.data_sharing
             FROM users u
             LEFT JOIN user_settings s ON u.id = s.user_id
             WHERE u.id = ?`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, dateOfBirth, country, profilePictureUrl } = req.body;

        const updateFields = [];
        const values = [];

        if (fullName) {
            updateFields.push('full_name = ?');
            values.push(fullName);
        }
        if (dateOfBirth) {
            updateFields.push('date_of_birth = ?');
            values.push(dateOfBirth);
        }
        if (country) {
            updateFields.push('country = ?');
            values.push(country);
        }
        if (profilePictureUrl) {
            updateFields.push('profile_picture_url = ?');
            values.push(profilePictureUrl);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.user.userId);

        await promisePool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update user settings
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { theme, notificationsEnabled, emailNotifications, dailyReminderTime, dataSharing } = req.body;

        const updateFields = [];
        const values = [];

        if (theme) {
            updateFields.push('theme = ?');
            values.push(theme);
        }
        if (notificationsEnabled !== undefined) {
            updateFields.push('notifications_enabled = ?');
            values.push(notificationsEnabled);
        }
        if (emailNotifications !== undefined) {
            updateFields.push('email_notifications = ?');
            values.push(emailNotifications);
        }
        if (dailyReminderTime) {
            updateFields.push('daily_reminder_time = ?');
            values.push(dailyReminderTime);
        }
        if (dataSharing !== undefined) {
            updateFields.push('data_sharing = ?');
            values.push(dataSharing);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No settings to update' });
        }

        values.push(req.user.userId);

        await promisePool.query(
            `UPDATE user_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
            values
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        await promisePool.query(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [req.user.userId]
        );

        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
