const express = require('express');
const { db, admin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get mood history for user
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;

        const snapshot = await db.collection('mood_entries')
            .where('user_id', '==', req.user.userId)
            .orderBy('entry_date', 'desc')
            .limit(parseInt(limit))
            .offset(parseInt(offset))
            .get();

        const moods = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            entry_date: doc.data().entry_date?.toDate?.() || doc.data().entry_date
        }));

        res.json(moods);
    } catch (error) {
        console.error('Get mood history error:', error);
        res.status(500).json({ error: 'Failed to fetch mood history' });
    }
});

// Save new mood entry
router.post('/entry', authenticateToken, async (req, res) => {
    try {
        const { mood, note } = req.body;

        if (!mood) {
            return res.status(400).json({ error: 'Mood is required' });
        }

        const validMoods = ['amazing', 'good', 'okay', 'down', 'struggling'];
        if (!validMoods.includes(mood)) {
            return res.status(400).json({ error: 'Invalid mood value' });
        }

        const docRef = await db.collection('mood_entries').add({
            user_id: req.user.userId,
            mood,
            note: note || null,
            entry_date: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            message: 'Mood saved successfully',
            id: docRef.id,
            mood,
            note,
            entry_date: new Date()
        });
    } catch (error) {
        console.error('Save mood error:', error);
        res.status(500).json({ error: 'Failed to save mood' });
    }
});

// Get mood statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(days));

        // Get mood entries within time range
        const recentSnap = await db.collection('mood_entries')
            .where('user_id', '==', req.user.userId)
            .where('entry_date', '>=', cutoff)
            .get();

        // Count by mood
        const moodCounts = {};
        recentSnap.docs.forEach(doc => {
            const m = doc.data().mood;
            moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
        const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

        // Get total entries
        const totalSnap = await db.collection('mood_entries')
            .where('user_id', '==', req.user.userId)
            .get();

        // Calculate streak
        const allEntries = totalSnap.docs.map(doc => {
            const d = doc.data().entry_date?.toDate?.() || new Date(doc.data().entry_date);
            return d.toISOString().split('T')[0];
        });
        const uniqueDates = [...new Set(allEntries)].sort().reverse();

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < uniqueDates.length; i++) {
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);
            const expected = expectedDate.toISOString().split('T')[0];
            if (uniqueDates[i] === expected) {
                streak++;
            } else {
                break;
            }
        }

        res.json({
            totalEntries: totalSnap.size,
            moodDistribution,
            streak,
            periodDays: parseInt(days)
        });
    } catch (error) {
        console.error('Get mood stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Delete mood entry
router.delete('/entry/:id', authenticateToken, async (req, res) => {
    try {
        const docRef = db.collection('mood_entries').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Mood entry not found' });
        }

        await docRef.delete();
        res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
        console.error('Delete mood error:', error);
        res.status(500).json({ error: 'Failed to delete mood entry' });
    }
});

module.exports = router;
