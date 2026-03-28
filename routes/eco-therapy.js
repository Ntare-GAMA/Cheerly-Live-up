const express = require('express');
const { db, admin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Log a nature/eco-therapy activity
router.post('/log', authenticateToken, async (req, res) => {
    try {
        const { activityType, durationMinutes, moodAfter, notes, location } = req.body;

        if (!activityType) {
            return res.status(400).json({ error: 'Activity type is required' });
        }

        const validActivities = [
            'Mindful Nature Walk', 'Forest Bathing', 'Garden Therapy',
            'Earthing / Grounding', 'Sunrise/Sunset Watching', 'Water Therapy',
            'Nature Meditation', 'Baobab Meditation', 'Star Story Telling',
            'Ubuntu Nature Circle', 'Nature Breathing', 'Earth Connection Meditation',
            '5 Senses Nature Scan', 'Fireside Reflection', 'River of Life Journaling',
            'Harvest Gratitude Walk', 'Other'
        ];

        if (!validActivities.includes(activityType)) {
            return res.status(400).json({ error: 'Invalid activity type' });
        }

        const validMoods = ['amazing', 'good', 'okay', 'down', 'struggling', null];
        if (moodAfter && !validMoods.includes(moodAfter)) {
            return res.status(400).json({ error: 'Invalid mood value' });
        }

        const logRef = await db.collection('eco_therapy_logs').add({
            user_id: req.user.userId,
            activity_type: activityType,
            duration_minutes: durationMinutes || null,
            mood_after: moodAfter || null,
            notes: notes || null,
            location: location || null,
            logged_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // If mood was recorded, also add a mood entry for cross-feature integration
        if (moodAfter) {
            await db.collection('mood_entries').add({
                user_id: req.user.userId,
                mood: moodAfter,
                note: `🌿 Eco-therapy: ${activityType}${durationMinutes ? ` (${durationMinutes} min)` : ''}`,
                entry_date: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(201).json({
            message: 'Eco-therapy activity logged successfully',
            id: logRef.id,
            activityType,
            durationMinutes,
            moodAfter
        });
    } catch (error) {
        console.error('Log eco-therapy activity error:', error);
        res.status(500).json({ error: 'Failed to log eco-therapy activity' });
    }
});

// Get user's eco-therapy activity history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const snapshot = await db.collection('eco_therapy_logs')
            .where('user_id', '==', req.user.userId)
            .orderBy('logged_at', 'desc')
            .limit(parseInt(limit))
            .offset(parseInt(offset))
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            logged_at: doc.data().logged_at ? doc.data().logged_at.toDate() : null
        }));

        res.json(logs);
    } catch (error) {
        console.error('Get eco-therapy history error:', error);
        res.status(500).json({ error: 'Failed to fetch eco-therapy history' });
    }
});

// Get eco-therapy statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        // Get all logs within the time range
        const snapshot = await db.collection('eco_therapy_logs')
            .where('user_id', '==', req.user.userId)
            .where('logged_at', '>=', cutoffDate)
            .orderBy('logged_at', 'desc')
            .get();

        const logs = snapshot.docs.map(doc => doc.data());

        // Total activities & minutes
        const totalActivities = logs.length;
        const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

        // Activity type breakdown
        const activityMap = {};
        logs.forEach(log => {
            if (!activityMap[log.activity_type]) {
                activityMap[log.activity_type] = { count: 0, totalDuration: 0 };
            }
            activityMap[log.activity_type].count++;
            activityMap[log.activity_type].totalDuration += (log.duration_minutes || 0);
        });
        const activityBreakdown = Object.entries(activityMap)
            .map(([activity_type, data]) => ({
                activity_type,
                count: data.count,
                avgDuration: data.count > 0 ? data.totalDuration / data.count : 0
            }))
            .sort((a, b) => b.count - a.count);

        // Mood improvement analysis
        const moodMap = {};
        logs.forEach(log => {
            if (log.mood_after) {
                moodMap[log.mood_after] = (moodMap[log.mood_after] || 0) + 1;
            }
        });
        const moodAfterEco = Object.entries(moodMap).map(([mood_after, count]) => ({
            mood_after, count
        }));

        // Weekly streak - get all logs for streak calculation
        const allLogsSnapshot = await db.collection('eco_therapy_logs')
            .where('user_id', '==', req.user.userId)
            .orderBy('logged_at', 'desc')
            .get();

        const uniqueDates = [...new Set(
            allLogsSnapshot.docs
                .filter(doc => doc.data().logged_at)
                .map(doc => {
                    const d = doc.data().logged_at.toDate();
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                })
        )].sort().reverse();

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < uniqueDates.length; i++) {
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);
            const expectedKey = `${expectedDate.getFullYear()}-${expectedDate.getMonth()}-${expectedDate.getDate()}`;

            if (uniqueDates[i] === expectedKey) {
                streak++;
            } else {
                break;
            }
        }

        const favoriteActivity = activityBreakdown.length > 0 ? activityBreakdown[0].activity_type : null;

        res.json({
            totalActivities,
            totalMinutes,
            streak,
            favoriteActivity,
            activityBreakdown,
            moodAfterEco
        });
    } catch (error) {
        console.error('Get eco-therapy stats error:', error);
        res.status(500).json({ error: 'Failed to fetch eco-therapy stats' });
    }
});

// Save/update weekly challenge progress
router.post('/challenge', authenticateToken, async (req, res) => {
    try {
        const { weekKey, completedDays } = req.body;

        if (!weekKey || !Array.isArray(completedDays)) {
            return res.status(400).json({ error: 'Week key and completed days are required' });
        }

        // Use composite key for upsert
        const docId = `${req.user.userId}_${weekKey}`;
        await db.collection('eco_challenges').doc(docId).set({
            user_id: req.user.userId,
            week_key: weekKey,
            completed_days: completedDays,
            days_completed: completedDays.length,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({
            message: 'Challenge progress saved',
            weekKey,
            daysCompleted: completedDays.length,
            isComplete: completedDays.length === 7
        });
    } catch (error) {
        console.error('Save challenge error:', error);
        res.status(500).json({ error: 'Failed to save challenge progress' });
    }
});

// Get challenge progress
router.get('/challenge', authenticateToken, async (req, res) => {
    try {
        const { weekKey } = req.query;

        let query = db.collection('eco_challenges')
            .where('user_id', '==', req.user.userId)
            .orderBy('week_key', 'desc')
            .limit(10);

        if (weekKey) {
            query = db.collection('eco_challenges')
                .where('user_id', '==', req.user.userId)
                .where('week_key', '==', weekKey)
                .limit(10);
        }

        const snapshot = await query.get();
        const challenges = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(challenges);
    } catch (error) {
        console.error('Get challenge error:', error);
        res.status(500).json({ error: 'Failed to fetch challenge progress' });
    }
});

// Get nature-themed affirmations
router.get('/affirmations', async (req, res) => {
    try {
        const snapshot = await db.collection('affirmations')
            .where('category', '==', 'nature')
            .where('is_active', '==', true)
            .get();

        const allAffirmations = snapshot.docs.map(doc => ({
            id: doc.id,
            affirmation_text: doc.data().affirmation_text,
            category: doc.data().category
        }));

        // Shuffle and pick 5
        const shuffled = allAffirmations.sort(() => Math.random() - 0.5);
        res.json(shuffled.slice(0, 5));
    } catch (error) {
        console.error('Get nature affirmations error:', error);
        res.status(500).json({ error: 'Failed to fetch nature affirmations' });
    }
});

module.exports = router;
