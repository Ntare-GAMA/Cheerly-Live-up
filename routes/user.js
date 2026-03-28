const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userDoc.data();

        // Get settings
        const settingsDoc = await db.collection('user_settings').doc(req.user.userId).get();
        const settings = settingsDoc.exists ? settingsDoc.data() : {};

        res.json({
            id: userDoc.id,
            email: user.email,
            full_name: user.full_name,
            date_of_birth: user.date_of_birth,
            country: user.country,
            signup_date: user.signup_date?.toDate?.() || user.signup_date,
            last_login: user.last_login?.toDate?.() || user.last_login,
            profile_picture_url: user.profile_picture_url,
                subscription_status: user.subscription_status || 'free',
            theme: settings.theme || 'light',
            notifications_enabled: settings.notifications_enabled ?? true,
            email_notifications: settings.email_notifications ?? true,
            daily_reminder_time: settings.daily_reminder_time || '09:00:00',
            data_sharing: settings.data_sharing ?? false
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, dateOfBirth, country, profilePictureUrl, subscriptionStatus } = req.body;

        const updates = {};
        if (fullName) updates.full_name = fullName;
        if (dateOfBirth) updates.date_of_birth = dateOfBirth;
        if (country) updates.country = country;
        if (profilePictureUrl) updates.profile_picture_url = profilePictureUrl;
        if (subscriptionStatus) updates.subscription_status = subscriptionStatus;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await db.collection('users').doc(req.user.userId).update(updates);

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

        const updates = {};
        if (theme) updates.theme = theme;
        if (notificationsEnabled !== undefined) updates.notifications_enabled = notificationsEnabled;
        if (emailNotifications !== undefined) updates.email_notifications = emailNotifications;
        if (dailyReminderTime) updates.daily_reminder_time = dailyReminderTime;
        if (dataSharing !== undefined) updates.data_sharing = dataSharing;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No settings to update' });
        }

        await db.collection('user_settings').doc(req.user.userId).set(updates, { merge: true });

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        await db.collection('users').doc(req.user.userId).update({ is_active: false });
        res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
