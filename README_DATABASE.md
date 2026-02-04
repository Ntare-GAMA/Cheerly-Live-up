# Cheerly Live Up - Database Setup Guide

## Prerequisites

1. **Install MySQL**: Download and install MySQL from [mysql.com](https://dev.mysql.com/downloads/)
2. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/) (v16 or higher)

## Setup Instructions

### 1. Install Dependencies

```bash
cd "c:\Users\user\Downloads\Cheerly Live-up"
npm install
```

### 2. Configure MySQL Database

1. Start MySQL server
2. Open MySQL command line or MySQL Workbench
3. Run the schema file:

```bash
mysql -u root -p < database/schema.sql
```

Or manually copy and paste the SQL from `database/schema.sql` into MySQL Workbench.

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

2. Edit `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cheerly_db
DB_PORT=3306

PORT=3000
JWT_SECRET=change_this_to_random_string_in_production
```

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 5. Test the API

Open your browser or use a tool like Postman:

- Health check: `http://localhost:3000/api/health`
- Register: POST to `http://localhost:3000/api/auth/register`
- Login: POST to `http://localhost:3000/api/auth/login`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Mood Tracking
- `GET /api/mood/history` - Get mood history (requires auth)
- `POST /api/mood/entry` - Save mood entry (requires auth)
- `GET /api/mood/stats` - Get mood statistics (requires auth)
- `DELETE /api/mood/entry/:id` - Delete mood entry (requires auth)

### Chat
- `POST /api/chat/session` - Create chat session (requires auth)
- `POST /api/chat/message` - Save chat message (requires auth)
- `GET /api/chat/session/:id` - Get chat history (requires auth)
- `GET /api/chat/sessions` - Get all user sessions (requires auth)

### User Profile
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update profile (requires auth)
- `PUT /api/user/settings` - Update settings (requires auth)
- `DELETE /api/user/account` - Delete account (requires auth)

### Affirmations
- `GET /api/affirmations/daily` - Get daily affirmation (requires auth)
- `GET /api/affirmations/all` - Get all affirmations

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get the token from the login or register response.

## Database Schema

The database includes:
- **users** - User accounts
- **mood_entries** - Mood tracking data
- **chat_sessions** - Chat conversation sessions
- **chat_messages** - Individual chat messages
- **affirmations** - Daily affirmations library
- **user_affirmations** - Track viewed affirmations
- **user_settings** - User preferences
- **crisis_resources** - Emergency helpline information

## Next Steps

Update your HTML files to use the API instead of localStorage. Example:

```javascript
// Instead of localStorage:
// localStorage.setItem('cheerlyUser', JSON.stringify(userData));

// Use fetch API:
const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

## Troubleshooting

**Database connection failed:**
- Make sure MySQL server is running
- Check credentials in `.env` file
- Verify database exists: `SHOW DATABASES;`

**Port already in use:**
- Change PORT in `.env` file
- Or stop the process using port 3000

**JWT errors:**
- Make sure JWT_SECRET is set in `.env`
- Token expires after 7 days, login again
