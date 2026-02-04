const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new chat session
router.post('/session', authenticateToken, async (req, res) => {
    try {
        const [result] = await promisePool.query(
            'INSERT INTO chat_sessions (user_id) VALUES (?)',
            [req.user.userId]
        );

        res.status(201).json({
            sessionId: result.insertId,
            sessionStart: new Date()
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create chat session' });
    }
});

// Save chat message
router.post('/message', authenticateToken, async (req, res) => {
    try {
        const { sessionId, messageType, messageText } = req.body;

        if (!sessionId || !messageType || !messageText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO chat_messages (session_id, user_id, message_type, message_text) VALUES (?, ?, ?, ?)',
            [sessionId, req.user.userId, messageType, messageText]
        );

        // Update message count
        await promisePool.query(
            'UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = ?',
            [sessionId]
        );

        res.status(201).json({
            messageId: result.insertId,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Save message error:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// Get chat history for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const [messages] = await promisePool.query(
            `SELECT id, message_type, message_text, timestamp 
             FROM chat_messages 
             WHERE session_id = ? AND user_id = ? 
             ORDER BY timestamp ASC`,
            [req.params.sessionId, req.user.userId]
        );

        res.json(messages);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const [sessions] = await promisePool.query(
            `SELECT id, session_start, session_end, message_count 
             FROM chat_sessions 
             WHERE user_id = ? 
             ORDER BY session_start DESC 
             LIMIT 50`,
            [req.user.userId]
        );

        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// End chat session
router.put('/session/:sessionId/end', authenticateToken, async (req, res) => {
    try {
        await promisePool.query(
            'UPDATE chat_sessions SET session_end = NOW() WHERE id = ? AND user_id = ?',
            [req.params.sessionId, req.user.userId]
        );

        res.json({ message: 'Session ended successfully' });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// Get personalized check-in message (human-like)
router.get('/checkin', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const hour = now.getHours();

        // Determine time of day
        let timeOfDay = 'morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17) timeOfDay = 'evening';

        // Get user's name
        const [users] = await promisePool.query(
            'SELECT full_name FROM users WHERE id = ?',
            [userId]
        );
        const firstName = users[0]?.full_name?.split(' ')[0] || 'friend';

        // Get today's tasks
        const [tasks] = await promisePool.query(
            `SELECT st.*, ds.schedule_date 
             FROM schedule_tasks st
             JOIN daily_schedules ds ON st.schedule_id = ds.id
             WHERE st.user_id = ? 
             AND ds.schedule_date = CURDATE()
             AND st.status != 'completed'
             ORDER BY st.start_time ASC`,
            [userId]
        );

        // Get recent mood
        const [moods] = await promisePool.query(
            `SELECT mood FROM mood_entries 
             WHERE user_id = ? 
             ORDER BY entry_date DESC 
             LIMIT 1`,
            [userId]
        );
        const recentMood = moods[0]?.mood;

        // Generate human-like message based on context
        const message = generateCheckinMessage(firstName, timeOfDay, tasks, recentMood);

        // Log the check-in
        await promisePool.query(
            'INSERT INTO chat_checkins (user_id, checkin_type, message_sent) VALUES (?, ?, ?)',
            [userId, timeOfDay, message]
        );

        res.json({ message, timeOfDay, taskCount: tasks.length });
    } catch (error) {
        console.error('Get check-in error:', error);
        res.status(500).json({ error: 'Failed to get check-in message' });
    }
});

// Get task reminders (human-like)
router.get('/task-reminders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get upcoming tasks in the next 2 hours
        const [tasks] = await promisePool.query(
            `SELECT st.*, ds.schedule_date 
             FROM schedule_tasks st
             JOIN daily_schedules ds ON st.schedule_id = ds.id
             WHERE st.user_id = ? 
             AND ds.schedule_date = CURDATE()
             AND st.status = 'pending'
             AND st.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR)
             ORDER BY st.start_time ASC
             LIMIT 3`,
            [userId]
        );

        const reminders = tasks.map(task => ({
            taskId: task.id,
            taskTitle: task.task_title,
            startTime: task.start_time,
            message: generateTaskReminder(task)
        }));

        res.json({ reminders });
    } catch (error) {
        console.error('Get task reminders error:', error);
        res.status(500).json({ error: 'Failed to get task reminders' });
    }
});

// Generate encouraging message based on progress
router.get('/encouragement', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get today's task stats
        const [stats] = await promisePool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
             FROM schedule_tasks st
             JOIN daily_schedules ds ON st.schedule_id = ds.id
             WHERE st.user_id = ? 
             AND ds.schedule_date = CURDATE()`,
            [userId]
        );

        const message = generateEncouragementMessage(stats[0]);

        res.json({ message, stats: stats[0] });
    } catch (error) {
        console.error('Get encouragement error:', error);
        res.status(500).json({ error: 'Failed to get encouragement' });
    }
});

// Helper function to generate human-like check-in messages
function generateCheckinMessage(name, timeOfDay, tasks, mood) {
    const greetings = {
        morning: [
            `Good morning, ${name}! ☀️ How are you feeling today?`,
            `Hey ${name}! Rise and shine! 🌅 Ready to tackle the day?`,
            `Morning ${name}! Hope you slept well. What's on your mind today?`,
            `Hi ${name}! Starting a new day - how's your energy level?`
        ],
        afternoon: [
            `Hey ${name}! 👋 How's your day going so far?`,
            `Afternoon ${name}! Hope you're having a good one! How are you feeling?`,
            `Hi there ${name}! Checking in - how are things going today?`,
            `Hey ${name}! Midday check-in - everything okay?`
        ],
        evening: [
            `Evening ${name}! 🌙 How was your day?`,
            `Hey ${name}! Winding down? How did everything go today?`,
            `Hi ${name}! Hope you had a good day. How are you feeling now?`,
            `Evening ${name}! Time to relax. Want to share how your day went?`
        ]
    };

    let greeting = greetings[timeOfDay][Math.floor(Math.random() * greetings[timeOfDay].length)];

    // Add context based on tasks
    if (tasks.length > 0) {
        const taskAddons = [
            ` I see you have ${tasks.length} task${tasks.length > 1 ? 's' : ''} planned today. Need any support with them?`,
            ` Looks like you've got ${tasks.length} thing${tasks.length > 1 ? 's' : ''} on your schedule. Feeling ready?`,
            ` I noticed you're planning to tackle ${tasks.length} task${tasks.length > 1 ? 's' : ''} today. That's great! How do you feel about it?`
        ];
        greeting += taskAddons[Math.floor(Math.random() * taskAddons.length)];
    }

    // Add mood-based message
    if (mood) {
        const moodResponses = {
            happy: " I'm glad you've been feeling good! Keep that positive energy going! 💪",
            sad: " I know things might be tough right now. Remember, I'm here for you, and it's okay to take things one step at a time. 💙",
            anxious: " Take a deep breath with me. You've got this, and I'm right here with you. 🌸",
            calm: " Love that calm energy! You're doing great. ✨",
            excited: " Your excitement is contagious! Channel that into today's goals! 🎉"
        };
        
        if (moodResponses[mood]) {
            greeting += moodResponses[mood];
        }
    }

    return greeting;
}

// Helper function to generate task reminder messages
function generateTaskReminder(task) {
    const reminders = [
        `Hey! Just a heads up - "${task.task_title}" is coming up soon. You've got this! 💪`,
        `Friendly reminder: "${task.task_title}" is on your schedule soon. Ready when you are! ✨`,
        `Hi there! Don't forget about "${task.task_title}" coming up. Take your time and do your best! 🌟`,
        `Quick reminder about "${task.task_title}" - no pressure, just wanted to give you a heads up! 😊`,
        `Hey friend! "${task.task_title}" is approaching. You're going to do great! 🎯`
    ];

    return reminders[Math.floor(Math.random() * reminders.length)];
}

// Helper function to generate encouragement messages
function generateEncouragementMessage(stats) {
    const total = stats.total || 0;
    const completed = stats.completed || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (total === 0) {
        return "Hey! How about setting up some goals for today? I'm here to help you plan! 📝";
    }

    if (percentage === 100) {
        return `Wow! You've completed ALL your tasks today! 🎉 That's absolutely amazing! You should be so proud of yourself! Take some time to celebrate this win! 🌟`;
    }

    if (percentage >= 75) {
        return `You're doing fantastic! ${completed} out of ${total} tasks done - that's ${percentage}%! You're almost there! Keep up the incredible work! 💪✨`;
    }

    if (percentage >= 50) {
        return `Great progress! You're halfway there with ${completed} tasks completed! ${percentage}% done - you're doing really well! Keep going! 🌟`;
    }

    if (percentage >= 25) {
        return `Nice start! You've completed ${completed} task${completed !== 1 ? 's' : ''} already. Every step forward counts! You're doing great! 💙`;
    }

    return `Hey, no worries about the pace! You have ${total} tasks planned and every small step matters. Want to tackle one together? I believe in you! 🌸`;
}

module.exports = router;
