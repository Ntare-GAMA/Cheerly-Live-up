# Cheerly Live Up - Site Map & Navigation Guide

## 📂 Complete Page Structure

### Public Pages (No Login Required)
1. **index.html** - Landing page with hero, features, and CTA
   - Links to: About, Chat, Mood Tracker, Resources, Contact, Signup, Login

2. **about.html** - Mission, vision, values, and team info
   - Links to: Home, Chat, Mood Tracker, Resources, Contact, Signup
   - Footer: Privacy, Terms, Contact

3. **resources.html** - Mental health toolkit and educational content
   - Links to: Home, About, Dashboard, Chat, Mood Tracker, Contact
   - Features: Crisis support, coping techniques, articles

4. **contact.html** - Contact form, FAQ, and support info
   - Links to: Home, About, Chat, Mood Tracker, Resources, Signup

5. **privacy.html** - Privacy policy and data protection
   - Links to: Home, About, Resources, Contact, Terms

6. **terms.html** - Terms of service and legal information
   - Links to: Home, About, Privacy, Contact

### Authentication Pages
7. **signup.html** - User registration
   - Links to: Home, About, Login
   - Features: Password strength checker, social signup placeholders
   - Redirects to: Dashboard (after successful signup)

8. **login.html** - User authentication
   - Links to: Home, About, Signup, Reset Password
   - Features: Remember me, social login placeholders
   - Quick access links to: Chat, Resources, About (for non-logged users)
   - Redirects to: Dashboard (after successful login)

9. **reset-password.html** - 3-step password recovery
   - Links to: Home, Login, Signup
   - Features: Email verification code, password strength indicator

### User Dashboard Pages (Login Required)
10. **dashboard.html** - Main user hub
    - Navigation: Logo, User Menu Dropdown
    - User Menu Links: Settings, Analytics, Privacy, Terms, Logout
    - Quick Actions: Chat, Mood Tracker, Analytics, Resources
    - Features: Stats cards, recent mood entries, daily affirmation

11. **mood-tracker.html** - Daily mood logging
    - Links to: Home, Dashboard, Chat, Analytics, Resources
    - Features: Mood entry form, streak tracking, history, localStorage persistence

12. **analytics.html** - Advanced mood analytics
    - Links to: Dashboard, Mood Tracker
    - Features: Time range selector, mood distribution, timeline chart, insights
    - Requires: Login (redirects to login.html if not authenticated)

13. **chat.html** - Chat support interface
    - Links to: Home, About, Dashboard, Mood Tracker, Resources, Contact
    - Features: Message interface, typing indicator, demo responses

14. **settings.html** - Account and preferences management
    - Links to: Dashboard, Home
    - Sections:
      - Profile (avatar, name, email, bio)
      - Security (password, 2FA)
      - Notifications (email, reminders)
      - Privacy (visibility, analytics)
      - Data & Storage (export, delete)

### Utility Pages
15. **404.html** - Error page for broken/missing links
    - Links to: Home, all major pages
    - Features: Helpful navigation to main sections

---

## 🔗 Navigation Flow

### Primary User Journey
```
index.html → signup.html → dashboard.html → [mood-tracker.html | chat.html | analytics.html]
                                          ↓
                                    settings.html
```

### Returning User Journey
```
index.html → login.html → dashboard.html → [Various Features]
```

### Password Recovery Flow
```
login.html → reset-password.html → login.html → dashboard.html
```

### Guest/Exploration Flow
```
index.html → [about.html | resources.html | contact.html | chat.html]
```

---

## 📊 Feature Integration Matrix

| Page | Chat | Mood Tracker | Analytics | Resources | Dashboard |
|------|------|--------------|-----------|-----------|-----------|
| **index.html** | ✓ | ✓ | - | ✓ | - |
| **about.html** | ✓ | ✓ | - | ✓ | - |
| **dashboard.html** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **chat.html** | ✓ | ✓ | - | ✓ | ✓ |
| **mood-tracker.html** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **analytics.html** | - | ✓ | ✓ | - | ✓ |
| **resources.html** | ✓ | ✓ | - | ✓ | ✓ |

---

## 🔐 Authentication & Data Flow

### localStorage Keys Used:
- `isLoggedIn` - Boolean authentication flag
- `currentUser` - User object (name, email, joinDate, age)
- `moodHistory` - Array of mood entries with timestamps
- `userPreferences` - Settings and preferences

### Protected Pages (Require Login):
- dashboard.html
- analytics.html
- settings.html

### Pages with Auth-Aware Features:
- chat.html (shows personalization if logged in)
- mood-tracker.html (stores data per user)
- All navigation (shows Dashboard link if logged in)

---

## 📱 Responsive Design
All pages include:
- Mobile-first responsive design
- Collapsible navigation on mobile (<768px)
- Touch-friendly buttons and forms
- Optimized layouts for tablets and phones

---

## 🎨 Design System
Consistent across all pages:
- **Primary Color**: #10b981 (Green)
- **Primary Dark**: #059669
- **Secondary**: #fbbf24 (Yellow/Gold)
- **Background Light**: #f0fdf4
- **Typography**: 'Segoe UI', system-ui, sans-serif
- **Border Radius**: 15-50px for modern, friendly feel
- **Shadows**: Soft, elevated with green tint

---

## 🚀 Next Steps for Enhancement
1. Add loading states for better UX
2. Implement actual backend API integration
3. Add more PWA features (offline support, installability)
4. Create onboarding tutorial for first-time users
5. Add notification system
6. Implement real-time chat with professional counselors
7. Add community/forum features
8. Integrate with wearables for mood tracking

---

## ✅ All Pages Are Now Connected!
Every page has proper navigation to related pages, creating a seamless user experience throughout the entire Cheerly Live Up platform.
