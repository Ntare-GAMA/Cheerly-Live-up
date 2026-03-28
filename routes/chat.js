const express = require('express');
const { db, admin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new chat session
router.post('/session', authenticateToken, async (req, res) => {
    try {
        // Get user subscription status
        const userDoc = await db.collection('users').doc(req.user.userId).get();
        const user = userDoc.data();
        const subscription = user.subscription_status || 'free';

        if (subscription === 'free') {
            // Limit free users to 5 chat sessions
            const sessionsSnap = await db.collection('chat_sessions')
                .where('user_id', '==', req.user.userId)
                .get();
            if (sessionsSnap.size >= 5) {
                return res.status(403).json({ error: 'Free users are limited to 5 chat sessions. Upgrade for unlimited access.' });
            }
        }

        const docRef = await db.collection('chat_sessions').add({
            user_id: req.user.userId,
            session_start: admin.firestore.FieldValue.serverTimestamp(),
            session_end: null,
            message_count: 0
        });

        res.status(201).json({
            sessionId: docRef.id,
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

        const msgRef = await db.collection('chat_messages').add({
            session_id: sessionId,
            user_id: req.user.userId,
            message_type: messageType,
            message_text: messageText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update message count
        await db.collection('chat_sessions').doc(sessionId).update({
            message_count: admin.firestore.FieldValue.increment(1)
        });

        res.status(201).json({
            messageId: msgRef.id,
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
        const snap = await db.collection('chat_messages')
            .where('session_id', '==', req.params.sessionId)
            .where('user_id', '==', req.user.userId)
            .orderBy('timestamp', 'asc')
            .get();

        const messages = snap.docs.map(doc => ({
            id: doc.id,
            message_type: doc.data().message_type,
            message_text: doc.data().message_text,
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        res.json(messages);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const snap = await db.collection('chat_sessions')
            .where('user_id', '==', req.user.userId)
            .orderBy('session_start', 'desc')
            .limit(50)
            .get();

        const sessions = snap.docs.map(doc => ({
            id: doc.id,
            session_start: doc.data().session_start?.toDate?.() || doc.data().session_start,
            session_end: doc.data().session_end?.toDate?.() || doc.data().session_end,
            message_count: doc.data().message_count
        }));

        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// End chat session
router.put('/session/:sessionId/end', authenticateToken, async (req, res) => {
    try {
        await db.collection('chat_sessions').doc(req.params.sessionId).update({
            session_end: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Session ended successfully' });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// Get personalized check-in message
router.get('/checkin', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const hour = now.getHours();

        let timeOfDay = 'morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17) timeOfDay = 'evening';

        // Get user's name
        const userDoc = await db.collection('users').doc(userId).get();
        const firstName = userDoc.data()?.full_name?.split(' ')[0] || 'friend';

        // Get today's incomplete tasks
        const today = new Date().toISOString().split('T')[0];
        const schedulesSnap = await db.collection('daily_schedules')
            .where('user_id', '==', userId)
            .where('schedule_date', '==', today)
            .limit(1)
            .get();

        let tasks = [];
        if (!schedulesSnap.empty) {
            const scheduleId = schedulesSnap.docs[0].id;
            const tasksSnap = await db.collection('schedule_tasks')
                .where('user_id', '==', userId)
                .where('schedule_id', '==', scheduleId)
                .where('status', '!=', 'completed')
                .get();
            tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Get recent mood
        const moodSnap = await db.collection('mood_entries')
            .where('user_id', '==', userId)
            .orderBy('entry_date', 'desc')
            .limit(1)
            .get();
        const recentMood = moodSnap.empty ? null : moodSnap.docs[0].data().mood;

        const message = generateCheckinMessage(firstName, timeOfDay, tasks, recentMood);

        // Log the check-in
        await db.collection('chat_checkins').add({
            user_id: userId,
            checkin_type: timeOfDay,
            message_sent: message,
            sent_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message, timeOfDay, taskCount: tasks.length });
    } catch (error) {
        console.error('Get check-in error:', error);
        res.status(500).json({ error: 'Failed to get check-in message' });
    }
});

// Get task reminders
router.get('/task-reminders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date().toISOString().split('T')[0];

        const schedulesSnap = await db.collection('daily_schedules')
            .where('user_id', '==', userId)
            .where('schedule_date', '==', today)
            .limit(1)
            .get();

        let reminders = [];
        if (!schedulesSnap.empty) {
            const scheduleId = schedulesSnap.docs[0].id;
            const now = new Date();
            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            const nowTime = now.toTimeString().slice(0, 8);
            const laterTime = twoHoursLater.toTimeString().slice(0, 8);

            const tasksSnap = await db.collection('schedule_tasks')
                .where('user_id', '==', userId)
                .where('schedule_id', '==', scheduleId)
                .where('status', '==', 'pending')
                .get();

            const upcomingTasks = tasksSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(t => t.start_time && t.start_time >= nowTime && t.start_time <= laterTime)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .slice(0, 3);

            reminders = upcomingTasks.map(task => ({
                taskId: task.id,
                taskTitle: task.task_title,
                startTime: task.start_time,
                message: generateTaskReminder(task)
            }));
        }

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
        const today = new Date().toISOString().split('T')[0];

        const schedulesSnap = await db.collection('daily_schedules')
            .where('user_id', '==', userId)
            .where('schedule_date', '==', today)
            .limit(1)
            .get();

        let stats = { total: 0, completed: 0 };
        if (!schedulesSnap.empty) {
            const scheduleId = schedulesSnap.docs[0].id;
            const tasksSnap = await db.collection('schedule_tasks')
                .where('user_id', '==', userId)
                .where('schedule_id', '==', scheduleId)
                .get();

            stats.total = tasksSnap.size;
            stats.completed = tasksSnap.docs.filter(d => d.data().status === 'completed').length;
        }

        const message = generateEncouragementMessage(stats);
        res.json({ message, stats });
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
