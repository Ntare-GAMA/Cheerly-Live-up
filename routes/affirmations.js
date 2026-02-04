const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get random daily affirmation
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        // Get affirmation user hasn't seen today
        const [affirmations] = await promisePool.query(
            `SELECT a.id, a.affirmation_text, a.category 
             FROM affirmations a 
             WHERE a.is_active = TRUE 
             AND a.id NOT IN (
                 SELECT affirmation_id 
                 FROM user_affirmations 
                 WHERE user_id = ? AND DATE(viewed_date) = CURDATE()
             )
             ORDER BY RAND() 
             LIMIT 1`,
            [req.user.userId]
        );

        if (affirmations.length === 0) {
            // If user has seen all, get any random one
            const [allAffirmations] = await promisePool.query(
                'SELECT id, affirmation_text, category FROM affirmations WHERE is_active = TRUE ORDER BY RAND() LIMIT 1'
            );
            
            if (allAffirmations.length === 0) {
                return res.status(404).json({ error: 'No affirmations available' });
            }

            const affirmation = allAffirmations[0];
            
            // Log that user viewed this affirmation
            await promisePool.query(
                'INSERT INTO user_affirmations (user_id, affirmation_id) VALUES (?, ?)',
                [req.user.userId, affirmation.id]
            );

            return res.json(affirmation);
        }

        const affirmation = affirmations[0];
        
        // Log that user viewed this affirmation
        await promisePool.query(
            'INSERT INTO user_affirmations (user_id, affirmation_id) VALUES (?, ?)',
            [req.user.userId, affirmation.id]
        );

        res.json(affirmation);
    } catch (error) {
        console.error('Get affirmation error:', error);
        res.status(500).json({ error: 'Failed to fetch affirmation' });
    }
});

// Get all affirmations
router.get('/all', async (req, res) => {
    try {
        const [affirmations] = await promisePool.query(
            'SELECT id, affirmation_text, category FROM affirmations WHERE is_active = TRUE ORDER BY RAND()'
        );

        res.json(affirmations);
    } catch (error) {
        console.error('Get all affirmations error:', error);
        res.status(500).json({ error: 'Failed to fetch affirmations' });
    }
});

module.exports = router;
