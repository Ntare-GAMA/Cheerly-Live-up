const express = require('express');
const { db, admin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get random daily affirmation
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        // Get IDs user has seen today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const viewedSnap = await db.collection('user_affirmations')
            .where('user_id', '==', req.user.userId)
            .where('viewed_date', '>=', todayStart)
            .get();

        const viewedIds = viewedSnap.docs.map(doc => doc.data().affirmation_id);

        // Get all active affirmations
        const affSnap = await db.collection('affirmations')
            .where('is_active', '==', true)
            .get();

        if (affSnap.empty) {
            return res.status(404).json({ error: 'No affirmations available' });
        }

        // Filter out already viewed
        let candidates = affSnap.docs.filter(doc => !viewedIds.includes(doc.id));
        if (candidates.length === 0) {
            candidates = affSnap.docs; // If all viewed, allow repeats
        }

        // Pick random
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const affirmation = { id: pick.id, ...pick.data() };

        // Log view
        await db.collection('user_affirmations').add({
            user_id: req.user.userId,
            affirmation_id: pick.id,
            viewed_date: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            id: affirmation.id,
            affirmation_text: affirmation.affirmation_text,
            category: affirmation.category
        });
    } catch (error) {
        console.error('Get affirmation error:', error);
        res.status(500).json({ error: 'Failed to fetch affirmation' });
    }
});

// Get all affirmations
router.get('/all', async (req, res) => {
    try {
        const snap = await db.collection('affirmations')
            .where('is_active', '==', true)
            .get();

        const affirmations = snap.docs.map(doc => ({
            id: doc.id,
            affirmation_text: doc.data().affirmation_text,
            category: doc.data().category
        }));

        // Shuffle
        for (let i = affirmations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [affirmations[i], affirmations[j]] = [affirmations[j], affirmations[i]];
        }

        res.json(affirmations);
    } catch (error) {
        console.error('Get all affirmations error:', error);
        res.status(500).json({ error: 'Failed to fetch affirmations' });
    }
});

module.exports = router;
