# 🌟 Cheerly Live Up - Mental Health Support Platform

A comprehensive web-based mental health support platform designed specifically for African youth, providing 24/7 chat support, mood tracking, resources, and community tools.

## 📋 Project Overview

**Cheerly Live Up** is a pure front-end mental health web application built with HTML5, CSS3, and vanilla JavaScript. It empowers young people to take control of their mental wellbeing through accessible, culturally-sensitive tools and resources.

### Key Features
- 💬 **Chat Support** - 24/7 conversational support with demo responses
- 😊 **Mood Tracking** - Daily emotional check-ins with analytics
- 📊 **Analytics Dashboard** - Visual insights into mood patterns and trends
- 📚 **Resource Library** - Mental health tools, coping techniques, and educational content
- 🆘 **Crisis Support** - Immediate access to emergency helplines
- 👤 **User Accounts** - Personalized experience with localStorage-based authentication
- ⚙️ **Settings** - Full account and preference management
- 📱 **Responsive Design** - Mobile-first, works on all devices

---

## 📂 File Structure

```
Cheerly Live-up/
│
├── index.html              # Landing page
├── about.html              # About us, mission, values
├── chat.html               # Chat interface
├── mood-tracker.html       # Daily mood logging
├── analytics.html          # Mood analytics & insights
├── resources.html          # Mental health resources
├── contact.html            # Contact form & FAQ
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
│
├── signup.html             # User registration
├── login.html              # User authentication
├── dashboard.html          # User dashboard
├── settings.html           # Account settings
├── reset-password.html     # Password recovery
│
├── 404.html                # Error page
├── SITE-MAP.md            # Navigation guide
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser!

### Installation & Running

1. **Download the project**
   ```bash
   # Download or clone this repository
   cd "Cheerly Live-up"
   ```

2. **Open in browser**
   - Simply double-click `index.html` to open in your default browser
   - Or right-click → "Open with" → Choose your browser
   - Or use a local development server (optional):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Python 2
     python -m SimpleHTTPServer 8000
     
     # Node.js (with http-server)
     npx http-server
     ```

3. **Start exploring!**
   - Visit the landing page
   - Click "Get Started Free" to create an account
   - Explore features like Chat, Mood Tracker, and Resources

---

## 💡 How to Use

### For First-Time Users
1. **Homepage** (`index.html`) - Learn about Cheerly Live Up
2. **Sign Up** (`signup.html`) - Create a free account (data stored locally)
3. **Dashboard** (`dashboard.html`) - Your personalized hub
4. **Log Mood** (`mood-tracker.html`) - Start tracking your emotions
5. **View Analytics** (`analytics.html`) - See your mood patterns
6. **Chat** (`chat.html`) - Get support from the chat companion

### For Returning Users
1. **Login** (`login.html`) - Access your account
2. **Dashboard** - View your stats and recent activity
3. **Settings** (`settings.html`) - Manage your profile and preferences

### Guest Exploration
You can explore these pages without an account:
- About Us
- Resources & Coping Techniques
- Chat (basic demo)
- Contact & FAQ

---

## 🔐 Authentication System

### How It Works
- **Pure localStorage** - No backend server required
- User data stored in browser's localStorage
- Simple demo authentication for prototype purposes

### Demo Credentials
Since this is a demo, you can create any account:
- Email: anything@example.com
- Password: any password (must be 8+ characters for validation)

### Data Storage Keys
```javascript
localStorage.isLoggedIn      // "true" or "false"
localStorage.currentUser     // JSON object with user data
localStorage.moodHistory     // Array of mood entries
localStorage.userPreferences // User settings
```

### ⚠️ Important Notes
- Data is stored **only in your browser**
- Clearing browser data will delete all user information
- Not suitable for production without proper backend integration
- For demonstration and prototype purposes only

---

## 📊 Features Breakdown

### 1. Mood Tracker
- **5 mood levels**: Amazing, Good, Okay, Down, Struggling
- **Notes field**: Add context to your mood
- **Streak tracking**: See your consecutive check-in days
- **History view**: Review past entries
- **Analytics integration**: Data flows to analytics page

### 2. Analytics Dashboard
- **Time filters**: Last 7/30/90/365 days
- **Mood distribution**: Bar charts showing mood frequency
- **Timeline chart**: Visual mood trends over time
- **Smart insights**: Generated observations about your patterns
- **Statistics**: Total check-ins, most common mood, current streak

### 3. Chat Support
- **Demo responses**: Predefined helpful responses
- **Quick actions**: Common questions as buttons
- **Typing indicator**: Realistic conversation feel
- **24/7 availability**: Always there when you need support

### 4. Resources Library
- **Crisis support banner**: Emergency contacts prominently displayed
- **Mental health toolkit**: 6 core categories
  - Self-Care Basics
  - Stress Management
  - Sleep Hygiene
  - Social Connection
  - Physical Activity
  - Mindfulness
- **Coping techniques**: Step-by-step guides for:
  - 4-7-8 Breathing
  - 5-4-3-2-1 Grounding
  - Progressive Muscle Relaxation
  - Journaling
- **Educational articles**: Mental health information

### 5. User Dashboard
- **Welcome message**: Personalized greeting
- **Stats cards**: 4 key metrics
  - Current streak
  - Total check-ins
  - Chat sessions
  - Days as member
- **Quick actions**: Fast access to main features
- **Recent moods**: Last 5 mood entries
- **Daily affirmation**: Motivational quotes

### 6. Settings Page
5 comprehensive sections:
- **Profile**: Avatar, name, email, age, bio
- **Security**: Password change, 2FA toggle
- **Notifications**: Email, reminders, affirmations
- **Privacy**: Visibility, analytics, legal links
- **Data & Storage**: Export data, delete account

---

## 🎨 Design System

### Color Palette
```css
--primary: #10b981        /* Green - Hope & Growth */
--primary-dark: #059669   /* Dark Green */
--secondary: #fbbf24      /* Gold - Warmth */
--text-dark: #1f2937      /* Charcoal */
--text-light: #6b7280     /* Gray */
--bg-light: #f0fdf4       /* Mint */
```

### Typography
- **Font Family**: 'Segoe UI', system-ui, sans-serif
- **Headings**: 700-900 weight
- **Body**: 400-600 weight
- **Line Height**: 1.6 for readability

### Design Principles
- **Friendly & Approachable**: Rounded corners, soft shadows
- **Accessible**: High contrast, large touch targets
- **Consistent**: Shared components across all pages
- **Mobile-First**: Optimized for phones, scales to desktop
- **Emoji-Enhanced**: Visual cues for better engagement

---

## 📱 Responsive Breakpoints

```css
/* Mobile First - Base styles for phones */
/* Default: 320px - 767px */

/* Tablets */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 968px) { ... }
@media (min-width: 1200px) { ... }
```

### Mobile Optimizations
- Hamburger menu (navigation collapses)
- Single-column layouts
- Larger tap targets (minimum 44px)
- Simplified forms
- Stack cards vertically

---

## 🔄 Navigation Map

### Main Navigation Structure
```
Home (index.html)
  ├─ About
  ├─ Resources
  ├─ Contact
  ├─ Sign Up ──→ Dashboard
  └─ Login ────→ Dashboard

Dashboard
  ├─ Chat
  ├─ Mood Tracker ──→ Analytics
  ├─ Analytics
  ├─ Resources
  └─ Settings
      ├─ Profile
      ├─ Security
      ├─ Notifications
      ├─ Privacy
      └─ Data Management
```

See `SITE-MAP.md` for complete navigation details.

---

## 🛠️ Technical Stack

### Front-End
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
  - Flexbox & Grid layouts
  - CSS Variables for theming
  - Animations & transitions
- **Vanilla JavaScript** - No frameworks
  - ES6+ features
  - localStorage API
  - Form validation
  - Dynamic content rendering

### No Dependencies
- Zero npm packages
- No build process required
- No external libraries
- Pure, lightweight code

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📈 Future Enhancements

### Short-Term (v1.1)
- [ ] Add dark mode toggle
- [ ] Implement onboarding tutorial
- [ ] Add more chat response variety
- [ ] Export mood data as CSV
- [ ] Add more affirmations

### Medium-Term (v1.5)
- [ ] PWA features (offline support, installability)
- [ ] Push notifications for mood reminders
- [ ] Advanced analytics (weekly/monthly reports)
- [ ] Goal setting & tracking
- [ ] Community forum (read-only)

### Long-Term (v2.0)
- [ ] Backend integration (Node.js/Firebase)
- [ ] Real database (MongoDB/PostgreSQL)
- [ ] User authentication (OAuth, JWT)
- [ ] Professional counselor chat
- [ ] Video sessions support
- [ ] Peer support groups
- [ ] Mobile apps (React Native)
- [ ] Enhanced chat (real NLP model)

---

## 🤝 Contributing

This is a prototype/demo project. If you'd like to enhance it:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Test across browsers
5. Submit a pull request

### Areas for Contribution
- 🐛 Bug fixes
- ✨ New features
- 🎨 UI/UX improvements
- 📱 Mobile optimization
- ♿ Accessibility enhancements
- 🌍 Internationalization (i18n)
- 📝 Documentation

---

## ⚠️ Important Disclaimers

### Medical Disclaimer
**Cheerly Live Up is NOT a substitute for professional mental health care.**

- This is a **demo/prototype** application
- The chat uses **pre-programmed responses**
- For serious mental health concerns, please consult a licensed professional
- In case of emergency, contact local emergency services immediately

### Crisis Resources
- **Emergency**: 112 / 911
- **WHO Mental Health**: +41 22 791 21 11
- **Crisis Text Line**: Text "HELLO" to local helpline

### Privacy & Data
- All data stored **locally in your browser**
- No data is sent to any server
- No analytics or tracking implemented
- Clear browser data = lose all information
- Not HIPAA or GDPR compliant in current form

---

## 📄 License

This project is open-source and available for educational and non-commercial use.

### Usage Rights
- ✅ Use for personal projects
- ✅ Modify and customize
- ✅ Learn from the code
- ✅ Share with proper attribution

### Restrictions
- ❌ Commercial use without permission
- ❌ Remove copyright notices
- ❌ Claim as your own work

---

## 👥 Credits

**Developed by**: Cheerly Live Up Team  
**Purpose**: Mental health support for African youth  
**Version**: 1.0.0  
**Last Updated**: January 2025

### Acknowledgments
- Mental health professionals who advised on content
- African youth focus groups for feedback
- Open-source community for inspiration

---

## 📞 Contact & Support

### Get in Touch
- **Email**: support@cheerlyliveup.com (demo)
- **Website**: [Contact Page](contact.html)
- **Social**: @CheerlyLiveUp (demo)

### Support Resources
- Check the [FAQ](contact.html#faq) first
- Read the [SITE-MAP.md](SITE-MAP.md) for navigation help
- Review [Privacy Policy](privacy.html) for data questions
- See [Terms of Service](terms.html) for usage guidelines

---

## 🙏 Thank You

Thank you for exploring Cheerly Live Up! Together, we can make mental health support more accessible to young people across Africa.

**Remember**: You are not alone. Your mental health matters. Help is always available. 💚

---

*Built with 💚 for the wellbeing of African youth*
