const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get mood history for user
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const [moods] = await promisePool.query(
            `SELECT id, mood, note, entry_date 
             FROM mood_entries 
             WHERE user_id = ? 
             ORDER BY entry_date DESC 
             LIMIT ? OFFSET ?`,
            [req.user.userId, parseInt(limit), parseInt(offset)]
        );

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

        const [result] = await promisePool.query(
            'INSERT INTO mood_entries (user_id, mood, note) VALUES (?, ?, ?)',
            [req.user.userId, mood, note || null]
        );

        res.status(201).json({
            message: 'Mood saved successfully',
            id: result.insertId,
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

        // Get mood counts
        const [moodCounts] = await promisePool.query(
            `SELECT mood, COUNT(*) as count 
             FROM mood_entries 
             WHERE user_id = ? AND entry_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY mood`,
            [req.user.userId, parseInt(days)]
        );

        // Get total entries
        const [total] = await promisePool.query(
            `SELECT COUNT(*) as total 
             FROM mood_entries 
             WHERE user_id = ?`,
            [req.user.userId]
        );

        // Calculate streak
        const [streakData] = await promisePool.query(
            `SELECT DATE(entry_date) as date 
             FROM mood_entries 
             WHERE user_id = ? 
             GROUP BY DATE(entry_date) 
             ORDER BY date DESC`,
            [req.user.userId]
        );

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < streakData.length; i++) {
            const entryDate = new Date(streakData[i].date);
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);
            
            if (entryDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        res.json({
            totalEntries: total[0].total,
            moodDistribution: moodCounts,
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
        const [result] = await promisePool.query(
            'DELETE FROM mood_entries WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mood entry not found' });
        }

        res.json({ message: 'Mood entry deleted successfully' });
    } catch (error) {
        console.error('Delete mood error:', error);
        res.status(500).json({ error: 'Failed to delete mood entry' });
    }
});

module.exports = router;
