# Day Planner Feature - Quick Start Guide

## 🎉 What's New?

Your Cheerly Live Up app now includes a complete **Day Planning & Scheduling** system with caring check-ins!

## ✨ Key Features Added

### 1. **Day Planner Page** (`day-planner.html`)
- Create and manage daily tasks
- Set priorities, times, and categories
- Track task completion
- Add daily notes
- View upcoming tasks
- Navigate between dates

### 2. **Smart Notifications**
- Task reminders before scheduled times
- Customizable reminder intervals (5, 15, 30, 60 minutes)
- Human-like reminder messages

### 3. **Caring Check-ins**
The chat companion now:
- Greets you based on time of day (morning/afternoon/evening)
- Checks in on your tasks and schedule
- Considers your recent mood when messaging
- Sends encouraging messages based on your progress
- Uses varied, natural language (not robotic!)

**Example Messages:**
- "Good morning, Sarah! ☀️ How are you feeling today? I see you have 3 tasks planned today. Need any support with them?"
- "Hey! Just a heads up - 'Team Meeting' is coming up in 15 minutes. You've got this! 💪"
- "You're doing fantastic! 3 out of 4 tasks done - that's 75%! You're almost there! Keep up the incredible work! 💪✨"

### 4. **Database Tables**
Four new tables added:
- `daily_schedules` - Daily schedule metadata
- `schedule_tasks` - Individual tasks with all details
- `schedule_notifications` - Automated notifications
- `chat_checkins` - Log of bot check-in messages

### 5. **API Endpoints**
New routes under `/api/schedule/`:
- `/today` - Get today's schedule
- `/date/:date` - Get schedule for specific date
- `/task` - Create/update tasks
- `/upcoming` - Get upcoming tasks
- `/stats` - Get task statistics

New chat endpoints:
- `/api/chat/checkin` - Get personalized greeting
- `/api/chat/task-reminders` - Get task reminders
- `/api/chat/encouragement` - Get motivational message

## 🚀 How to Use

### Setting Up

1. **Update Database:**
   ```bash
   mysql -u your_user -p cheerly_db < database/schema.sql
   ```

2. **Start Server:**
   ```bash
   npm start
   ```

3. **Access the App:**
   - Open your browser to `http://localhost:5500` (or your frontend URL)
   - Login to your account
   - Click "Day Planner" from the dashboard

### Using the Day Planner

1. **Add a Task:**
   - Click "➕ Add Task"
   - Fill in the task details
   - Set priority and reminder
   - Save!

2. **Manage Tasks:**
   - Complete: Click "✓ Complete"
   - Edit: Click "✏️ Edit"
   - Delete: Click "🗑️ Delete"

3. **Navigate Dates:**
   - Use arrows to browse days
   - Click "Today" to return to current day
   - Use date picker for specific dates

### Experiencing Human-Like Check-ins

1. **Open Chat:**
   - Navigate to the chat page
   - You'll receive a personalized greeting based on:
     - Time of day
     - Your tasks for today
     - Your recent mood entries

2. **Receive Reminders:**
   - The companion will send friendly reminders about upcoming tasks
   - Messages feel like a caring friend checking in on you

3. **Get Encouragement:**
   - The bot tracks your progress and sends motivational messages
   - Celebrates your achievements
   - Offers support when tasks are overwhelming

## 📋 Files Modified/Created

### Created:
- `routes/schedule.js` - Schedule API routes
- `day-planner.html` - Day planner interface
- `README_DAY_PLANNER.md` - Full documentation

### Modified:
- `database/schema.sql` - Added 4 new tables
- `server.js` - Added schedule routes
- `routes/chat.js` - Added check-in functionality
- `dashboard.html` - Added Day Planner quick action
- `chat.html` - Enhanced with personalized check-ins
- `index.html` - Added Day Planner to features

## 🎨 Chat Companion Personality

The chat companion now talks like a caring human friend:

**Before:**
> "Your task is scheduled for 14:00."

**After:**
> "Hey! Just a friendly reminder: 'Team Meeting' is coming up in 15 minutes. You've got this! 💪"

**Features:**
- Uses first names
- Varied greetings and responses
- Considers context (mood, tasks, time)
- Encourages without being pushy
- Celebrates wins
- Offers support during stress

## 🔧 Configuration

### Reminder Settings
Users can set reminders for:
- 5 minutes before
- 15 minutes before (default)
- 30 minutes before
- 1 hour before

### Notification Types
- `task_reminder` - Before scheduled tasks
- `daily_check_in` - Morning/afternoon/evening
- `encouragement` - Based on progress
- `schedule_summary` - Daily overview

## 📊 Task Priorities
- **Low** - Blue badge
- **Medium** - Yellow badge (default)
- **High** - Red badge

## 💡 Tips

1. **Set Realistic Times:** Add buffer time between tasks
2. **Use Categories:** Organize tasks by type (Work, Personal, Health)
3. **Enable Reminders:** Stay on track with friendly notifications
4. **Check Chat Daily:** Get personalized check-ins and support
5. **Celebrate Progress:** The bot will celebrate with you!

## 🐛 Troubleshooting

**Tasks not saving?**
- Check if you're logged in
- Verify server is running
- Check browser console for errors

**Not receiving check-ins?**
- Make sure you're on the chat page
- Check if tasks are scheduled for today
- Verify authentication token

**Database errors?**
- Run the schema.sql file
- Check MySQL is running
- Verify database connection in config

## 📚 Learn More

See `README_DAY_PLANNER.md` for complete documentation including:
- Full API reference
- Database schema details
- Customization guide
- Future enhancement ideas

---

**Enjoy planning your day with your caring wellness companion! 🌟**
