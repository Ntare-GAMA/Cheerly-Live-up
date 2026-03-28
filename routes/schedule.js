const express = require('express');
const { db, admin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: find or create schedule for a date
async function getOrCreateSchedule(userId, date) {
    const snap = await db.collection('daily_schedules')
        .where('user_id', '==', userId)
        .where('schedule_date', '==', date)
        .limit(1)
        .get();

    if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    const docRef = await db.collection('daily_schedules').add({
        user_id: userId,
        schedule_date: date,
        title: 'My Day',
        notes: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        id: docRef.id,
        user_id: userId,
        schedule_date: date,
        title: 'My Day',
        notes: null
    };
}

// Get or create today's schedule
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const schedule = await getOrCreateSchedule(req.user.userId, today);

        // Get tasks for this schedule
        const tasksSnap = await db.collection('schedule_tasks')
            .where('schedule_id', '==', schedule.id)
            .orderBy('start_time', 'asc')
            .get();

        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ schedule, tasks });
    } catch (error) {
        console.error('Get today schedule error:', error);
        res.status(500).json({ error: "Failed to fetch today's schedule" });
    }
});

// Get schedule by date
router.get('/date/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;

        const snap = await db.collection('daily_schedules')
            .where('user_id', '==', req.user.userId)
            .where('schedule_date', '==', date)
            .limit(1)
            .get();

        if (snap.empty) {
            return res.json({ schedule: null, tasks: [] });
        }

        const schedule = { id: snap.docs[0].id, ...snap.docs[0].data() };

        const tasksSnap = await db.collection('schedule_tasks')
            .where('schedule_id', '==', schedule.id)
            .orderBy('start_time', 'asc')
            .get();

        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ schedule, tasks });
    } catch (error) {
        console.error('Get schedule by date error:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// Create or update schedule
router.post('/schedule', authenticateToken, async (req, res) => {
    try {
        const { scheduleDate, title, notes } = req.body;

        if (!scheduleDate) {
            return res.status(400).json({ error: 'Schedule date is required' });
        }

        const snap = await db.collection('daily_schedules')
            .where('user_id', '==', req.user.userId)
            .where('schedule_date', '==', scheduleDate)
            .limit(1)
            .get();

        let scheduleId;
        if (!snap.empty) {
            scheduleId = snap.docs[0].id;
            await snap.docs[0].ref.update({
                title: title || 'My Day',
                notes: notes || null,
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const docRef = await db.collection('daily_schedules').add({
                user_id: req.user.userId,
                schedule_date: scheduleDate,
                title: title || 'My Day',
                notes: notes || null,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            scheduleId = docRef.id;
        }

        res.status(201).json({ scheduleId, message: 'Schedule saved successfully' });
    } catch (error) {
        console.error('Save schedule error:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// Add task to schedule
router.post('/task', authenticateToken, async (req, res) => {
    try {
        const {
            scheduleId,
            taskTitle,
            taskDescription,
            startTime,
            endTime,
            priority,
            category,
            reminderEnabled,
            reminderMinutesBefore
        } = req.body;

        if (!scheduleId || !taskTitle) {
            return res.status(400).json({ error: 'Schedule ID and task title are required' });
        }

        const taskRef = await db.collection('schedule_tasks').add({
            schedule_id: scheduleId,
            user_id: req.user.userId,
            task_title: taskTitle,
            task_description: taskDescription || null,
            start_time: startTime || null,
            end_time: endTime || null,
            priority: priority || 'medium',
            status: 'pending',
            category: category || null,
            reminder_enabled: reminderEnabled !== false,
            reminder_minutes_before: reminderMinutesBefore || 15,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            completed_at: null
        });

        // Create notification if reminder is enabled
        if (reminderEnabled !== false && startTime) {
            const scheduleDoc = await db.collection('daily_schedules').doc(scheduleId).get();
            if (scheduleDoc.exists) {
                const scheduleDate = scheduleDoc.data().schedule_date;
                const reminderTime = new Date(`${scheduleDate}T${startTime}`);
                reminderTime.setMinutes(reminderTime.getMinutes() - (reminderMinutesBefore || 15));

                await db.collection('schedule_notifications').add({
                    user_id: req.user.userId,
                    task_id: taskRef.id,
                    notification_type: 'task_reminder',
                    notification_message: `Hey! Just a friendly reminder: "${taskTitle}" is coming up in ${reminderMinutesBefore || 15} minutes. You've got this! 💪`,
                    scheduled_time: reminderTime,
                    sent_at: null,
                    status: 'pending',
                    created_at: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        res.status(201).json({
            taskId: taskRef.id,
            message: 'Task added successfully'
        });
    } catch (error) {
        console.error('Add task error:', error);
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Update task
router.put('/task/:taskId', authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { taskTitle, taskDescription, startTime, endTime, priority, status, category } = req.body;

        const docRef = db.collection('schedule_tasks').doc(taskId);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
        if (taskTitle !== undefined) updates.task_title = taskTitle;
        if (taskDescription !== undefined) updates.task_description = taskDescription;
        if (startTime !== undefined) updates.start_time = startTime;
        if (endTime !== undefined) updates.end_time = endTime;
        if (priority !== undefined) updates.priority = priority;
        if (status !== undefined) updates.status = status;
        if (category !== undefined) updates.category = category;
        if (status === 'completed') updates.completed_at = admin.firestore.FieldValue.serverTimestamp();

        await docRef.update(updates);

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/task/:taskId', authenticateToken, async (req, res) => {
    try {
        const docRef = db.collection('schedule_tasks').doc(req.params.taskId);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().user_id !== req.user.userId) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await docRef.delete();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get upcoming tasks
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get schedules from today onward
        const schedulesSnap = await db.collection('daily_schedules')
            .where('user_id', '==', req.user.userId)
            .where('schedule_date', '>=', today)
            .orderBy('schedule_date', 'asc')
            .get();

        const scheduleIds = schedulesSnap.docs.map(d => d.id);
        if (scheduleIds.length === 0) {
            return res.json([]);
        }

        // Firestore 'in' queries limited to 30 items
        const batchIds = scheduleIds.slice(0, 30);
        const tasksSnap = await db.collection('schedule_tasks')
            .where('user_id', '==', req.user.userId)
            .where('schedule_id', 'in', batchIds)
            .get();

        const scheduleMap = {};
        schedulesSnap.docs.forEach(d => { scheduleMap[d.id] = d.data().schedule_date; });

        const tasks = tasksSnap.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                schedule_date: scheduleMap[doc.data().schedule_id]
            }))
            .filter(t => t.status !== 'completed')
            .sort((a, b) => {
                if (a.schedule_date !== b.schedule_date) return a.schedule_date.localeCompare(b.schedule_date);
                return (a.start_time || '').localeCompare(b.start_time || '');
            })
            .slice(0, 10);

        res.json(tasks);
    } catch (error) {
        console.error('Get upcoming tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
    }
});

// Get task statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const schedulesSnap = await db.collection('daily_schedules')
            .where('user_id', '==', req.user.userId)
            .where('schedule_date', '>=', weekAgoStr)
            .get();

        const scheduleIds = schedulesSnap.docs.map(d => d.id);
        if (scheduleIds.length === 0) {
            return res.json({ total_tasks: 0, completed_tasks: 0, pending_tasks: 0, in_progress_tasks: 0 });
        }

        const batchIds = scheduleIds.slice(0, 30);
        const tasksSnap = await db.collection('schedule_tasks')
            .where('user_id', '==', req.user.userId)
            .where('schedule_id', 'in', batchIds)
            .get();

        const stats = {
            total_tasks: tasksSnap.size,
            completed_tasks: 0,
            pending_tasks: 0,
            in_progress_tasks: 0
        };

        tasksSnap.docs.forEach(doc => {
            const s = doc.data().status;
            if (s === 'completed') stats.completed_tasks++;
            else if (s === 'pending') stats.pending_tasks++;
            else if (s === 'in-progress') stats.in_progress_tasks++;
        });

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
