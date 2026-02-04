const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get or create today's schedule
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Try to get existing schedule
        let [schedules] = await promisePool.query(
            'SELECT * FROM daily_schedules WHERE user_id = ? AND schedule_date = ?',
            [req.user.userId, today]
        );

        let schedule;
        if (schedules.length === 0) {
            // Create new schedule for today
            const [result] = await promisePool.query(
                'INSERT INTO daily_schedules (user_id, schedule_date, title) VALUES (?, ?, ?)',
                [req.user.userId, today, 'My Day']
            );
            
            schedule = {
                id: result.insertId,
                user_id: req.user.userId,
                schedule_date: today,
                title: 'My Day',
                notes: null
            };
        } else {
            schedule = schedules[0];
        }

        // Get tasks for this schedule
        const [tasks] = await promisePool.query(
            `SELECT * FROM schedule_tasks 
             WHERE schedule_id = ? 
             ORDER BY start_time ASC, priority DESC`,
            [schedule.id]
        );

        res.json({ schedule, tasks });
    } catch (error) {
        console.error('Get today schedule error:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s schedule' });
    }
});

// Get schedule by date
router.get('/date/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;

        const [schedules] = await promisePool.query(
            'SELECT * FROM daily_schedules WHERE user_id = ? AND schedule_date = ?',
            [req.user.userId, date]
        );

        if (schedules.length === 0) {
            return res.json({ schedule: null, tasks: [] });
        }

        const [tasks] = await promisePool.query(
            `SELECT * FROM schedule_tasks 
             WHERE schedule_id = ? 
             ORDER BY start_time ASC, priority DESC`,
            [schedules[0].id]
        );

        res.json({ schedule: schedules[0], tasks });
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

        // Check if schedule exists
        const [existing] = await promisePool.query(
            'SELECT id FROM daily_schedules WHERE user_id = ? AND schedule_date = ?',
            [req.user.userId, scheduleDate]
        );

        let scheduleId;
        if (existing.length > 0) {
            // Update existing
            await promisePool.query(
                'UPDATE daily_schedules SET title = ?, notes = ? WHERE id = ?',
                [title || 'My Day', notes, existing[0].id]
            );
            scheduleId = existing[0].id;
        } else {
            // Create new
            const [result] = await promisePool.query(
                'INSERT INTO daily_schedules (user_id, schedule_date, title, notes) VALUES (?, ?, ?, ?)',
                [req.user.userId, scheduleDate, title || 'My Day', notes]
            );
            scheduleId = result.insertId;
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

        const [result] = await promisePool.query(
            `INSERT INTO schedule_tasks 
             (schedule_id, user_id, task_title, task_description, start_time, end_time, 
              priority, category, reminder_enabled, reminder_minutes_before) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                scheduleId, 
                req.user.userId, 
                taskTitle, 
                taskDescription, 
                startTime, 
                endTime, 
                priority || 'medium', 
                category,
                reminderEnabled !== false,
                reminderMinutesBefore || 15
            ]
        );

        // Create notification if reminder is enabled
        if (reminderEnabled !== false && startTime) {
            const [schedule] = await promisePool.query(
                'SELECT schedule_date FROM daily_schedules WHERE id = ?',
                [scheduleId]
            );

            if (schedule.length > 0) {
                const reminderTime = new Date(`${schedule[0].schedule_date}T${startTime}`);
                reminderTime.setMinutes(reminderTime.getMinutes() - (reminderMinutesBefore || 15));

                await promisePool.query(
                    `INSERT INTO schedule_notifications 
                     (user_id, task_id, notification_type, notification_message, scheduled_time) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        req.user.userId,
                        result.insertId,
                        'task_reminder',
                        `Hey! Just a friendly reminder: "${taskTitle}" is coming up in ${reminderMinutesBefore || 15} minutes. You've got this! 💪`,
                        reminderTime
                    ]
                );
            }
        }

        res.status(201).json({ 
            taskId: result.insertId, 
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
        const { 
            taskTitle, 
            taskDescription, 
            startTime, 
            endTime, 
            priority, 
            status,
            category 
        } = req.body;

        await promisePool.query(
            `UPDATE schedule_tasks 
             SET task_title = COALESCE(?, task_title),
                 task_description = COALESCE(?, task_description),
                 start_time = COALESCE(?, start_time),
                 end_time = COALESCE(?, end_time),
                 priority = COALESCE(?, priority),
                 status = COALESCE(?, status),
                 category = COALESCE(?, category),
                 completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
             WHERE id = ? AND user_id = ?`,
            [taskTitle, taskDescription, startTime, endTime, priority, status, category, status, taskId, req.user.userId]
        );

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/task/:taskId', authenticateToken, async (req, res) => {
    try {
        await promisePool.query(
            'DELETE FROM schedule_tasks WHERE id = ? AND user_id = ?',
            [req.params.taskId, req.user.userId]
        );

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get upcoming tasks
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const [tasks] = await promisePool.query(
            `SELECT st.*, ds.schedule_date 
             FROM schedule_tasks st
             JOIN daily_schedules ds ON st.schedule_id = ds.id
             WHERE st.user_id = ? 
             AND ds.schedule_date >= CURDATE()
             AND st.status != 'completed'
             ORDER BY ds.schedule_date ASC, st.start_time ASC
             LIMIT 10`,
            [req.user.userId]
        );

        res.json(tasks);
    } catch (error) {
        console.error('Get upcoming tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
    }
});

// Get task statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await promisePool.query(
            `SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks
             FROM schedule_tasks st
             JOIN daily_schedules ds ON st.schedule_id = ds.id
             WHERE st.user_id = ? 
             AND ds.schedule_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [req.user.userId]
        );

        res.json(stats[0]);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
