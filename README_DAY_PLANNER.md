# Day Planner Feature Documentation

## Overview
The Day Planner feature is a comprehensive scheduling and task management system integrated into Cheerly Live Up. It helps users organize their daily activities, receive timely reminders, and get caring check-ins from the chatbot throughout the day.

## Features

### 📅 Daily Schedule Management
- **Date Navigation**: Browse schedules for any date (past, present, or future)
- **Task Organization**: Create, edit, and manage tasks with detailed information
- **Visual Timeline**: See all tasks organized by time
- **Daily Notes**: Add personal notes to each day's schedule

### ✅ Task Management
- **Task Creation**: Add tasks with titles, descriptions, times, and priorities
- **Priority Levels**: Low, Medium, High priority settings
- **Categories**: Organize tasks by custom categories (Work, Personal, Health, etc.)
- **Status Tracking**: Track tasks as Pending, In Progress, Completed, or Cancelled
- **Time Slots**: Assign start and end times to tasks

### 🔔 Smart Notifications
- **Task Reminders**: Get notified before tasks start (customizable intervals)
- **Human-like Messages**: Reminders feel like a friend checking in on you
- **Check-in Messages**: Receive personalized morning, afternoon, and evening check-ins
- **Progress Encouragement**: Get motivational messages based on your task completion

### 📊 Statistics & Insights
- **Daily Stats**: Track total, completed, pending, and in-progress tasks
- **Progress Tracking**: Visual representation of your daily achievements
- **Upcoming Tasks**: Quick view of what's coming up next

### 💬 Chatbot Integration
The chatbot now sends human-like messages including:
- **Personalized Greetings**: Based on time of day and your recent mood
- **Task Reminders**: Friendly notifications about upcoming tasks
- **Progress Check-ins**: Caring messages about your task completion
- **Encouragement**: Motivational messages tailored to your progress

## Database Schema

### Tables Created

#### `daily_schedules`
Stores daily schedule metadata for each user.
```sql
- id: INT PRIMARY KEY
- user_id: INT (FK to users)
- schedule_date: DATE
- title: VARCHAR(255)
- notes: TEXT
- created_at, updated_at: TIMESTAMP
```

#### `schedule_tasks`
Individual tasks within a daily schedule.
```sql
- id: INT PRIMARY KEY
- schedule_id: INT (FK to daily_schedules)
- user_id: INT (FK to users)
- task_title: VARCHAR(255)
- task_description: TEXT
- start_time, end_time: TIME
- priority: ENUM('low', 'medium', 'high')
- status: ENUM('pending', 'in-progress', 'completed', 'cancelled')
- category: VARCHAR(100)
- reminder_enabled: BOOLEAN
- reminder_minutes_before: INT
- created_at, updated_at, completed_at: TIMESTAMP
```

#### `schedule_notifications`
System-generated notifications for tasks and check-ins.
```sql
- id: INT PRIMARY KEY
- user_id: INT (FK to users)
- task_id: INT (FK to schedule_tasks)
- notification_type: ENUM('task_reminder', 'daily_check_in', 'encouragement', 'schedule_summary')
- notification_message: TEXT
- scheduled_time: TIMESTAMP
- sent_at: TIMESTAMP
- status: ENUM('pending', 'sent', 'failed')
```

#### `chat_checkins`
Logs all chatbot check-in messages sent to users.
```sql
- id: INT PRIMARY KEY
- user_id: INT (FK to users)
- checkin_type: ENUM('morning', 'afternoon', 'evening', 'task_reminder', 'encouragement')
- message_sent: TEXT
- sent_at: TIMESTAMP
- user_responded: BOOLEAN
```

## API Endpoints

### Schedule Routes (`/api/schedule`)

#### Get Today's Schedule
```
GET /api/schedule/today
Headers: Authorization: Bearer <token>
Returns: { schedule: {...}, tasks: [...] }
```

#### Get Schedule by Date
```
GET /api/schedule/date/:date
Headers: Authorization: Bearer <token>
Returns: { schedule: {...}, tasks: [...] }
```

#### Create/Update Schedule
```
POST /api/schedule/schedule
Headers: Authorization: Bearer <token>
Body: {
  scheduleDate: "2026-02-04",
  title: "My Day",
  notes: "Daily notes..."
}
```

#### Add Task
```
POST /api/schedule/task
Headers: Authorization: Bearer <token>
Body: {
  scheduleId: 1,
  taskTitle: "Complete project",
  taskDescription: "Finish the presentation",
  startTime: "14:00",
  endTime: "16:00",
  priority: "high",
  category: "Work",
  reminderEnabled: true,
  reminderMinutesBefore: 15
}
```

#### Update Task
```
PUT /api/schedule/task/:taskId
Headers: Authorization: Bearer <token>
Body: { status: "completed", ... }
```

#### Delete Task
```
DELETE /api/schedule/task/:taskId
Headers: Authorization: Bearer <token>
```

#### Get Upcoming Tasks
```
GET /api/schedule/upcoming
Headers: Authorization: Bearer <token>
Returns: Array of upcoming tasks (next 10)
```

#### Get Task Statistics
```
GET /api/schedule/stats
Headers: Authorization: Bearer <token>
Returns: { total_tasks, completed_tasks, pending_tasks, in_progress_tasks }
```

### Chat Enhancement Routes (`/api/chat`)

#### Get Personalized Check-in
```
GET /api/chat/checkin
Headers: Authorization: Bearer <token>
Returns: {
  message: "Personalized greeting...",
  timeOfDay: "morning",
  taskCount: 5
}
```

#### Get Task Reminders
```
GET /api/chat/task-reminders
Headers: Authorization: Bearer <token>
Returns: {
  reminders: [
    {
      taskId: 1,
      taskTitle: "Meeting",
      startTime: "14:00",
      message: "Hey! Just a heads up..."
    }
  ]
}
```

#### Get Encouragement Message
```
GET /api/chat/encouragement
Headers: Authorization: Bearer <token>
Returns: {
  message: "You're doing great!...",
  stats: { total: 5, completed: 3 }
}
```

## Usage Instructions

### For Users

1. **Access the Day Planner**
   - Navigate to the Day Planner from the dashboard or main menu
   - The current day's schedule loads automatically

2. **Create a Task**
   - Click the "Add Task" button
   - Fill in task details (title is required)
   - Set times, priority, and reminder preferences
   - Click "Save Task"

3. **Manage Tasks**
   - Click "✓ Complete" to mark a task as done
   - Click "✏️ Edit" to modify task details
   - Click "🗑️ Delete" to remove a task

4. **Navigate Dates**
   - Use "Previous" and "Next" buttons to browse dates
   - Click "Today" to quickly return to the current day
   - Use the date picker for specific dates

5. **Add Daily Notes**
   - Type notes in the sidebar text area
   - Click "Save Notes" to store them

6. **Chat Integration**
   - Open the chat to receive personalized check-ins
   - The chatbot will mention your tasks and offer support
   - You'll get friendly reminders about upcoming activities

### For Developers

#### Running the Application

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Database**
   ```bash
   # Run the updated schema
   mysql -u your_user -p cheerly_db < database/schema.sql
   ```

3. **Start the Server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

4. **Access the Frontend**
   - Open `index.html` in a browser or use a local server
   - Login/Signup to access the Day Planner

#### Customizing Messages

Human-like messages are generated in `routes/chat.js`:
- **`generateCheckinMessage()`**: Morning/afternoon/evening greetings
- **`generateTaskReminder()`**: Task reminder messages
- **`generateEncouragementMessage()`**: Progress-based motivation

Modify these functions to customize the chatbot's personality.

## Future Enhancements

Potential features to add:
- 📱 Push notifications (browser notifications API)
- 🔄 Recurring tasks (daily, weekly, monthly)
- 🎯 Goals and habits tracking
- 📈 Advanced analytics and insights
- 🤝 Shared schedules (for group activities)
- 🔗 Calendar integration (Google Calendar, Outlook)
- 🎨 Custom themes for different task types
- ⏰ Smart scheduling suggestions based on patterns

## Troubleshooting

### Tasks not loading?
- Check browser console for errors
- Verify authentication token is valid
- Ensure server is running on port 3000

### Reminders not appearing in chat?
- Check that `reminder_enabled` is true for the task
- Verify the scheduled time hasn't passed
- Check the `schedule_notifications` table for pending notifications

### Database errors?
- Ensure all new tables are created (run schema.sql)
- Check foreign key relationships
- Verify user is authenticated

## Contributing

When adding features:
1. Update database schema if needed
2. Add corresponding API routes
3. Update frontend UI
4. Document changes in this README
5. Test thoroughly with different user scenarios

---

**Version**: 1.0.0  
**Last Updated**: February 4, 2026  
**Maintainer**: Cheerly Live Up Development Team
