# Prime Talk - Comprehensive Project Documentation

## 🎯 Project Overview

**Prime Talk** is a React + Supabase tutoring platform for instant and scheduled English lessons with Daily.co video integration. It's a modern, real-time application designed for students and teachers to connect for language learning sessions.

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 3.4 with custom glassmorphism effects
- **Routing**: React Router 7
- **State Management**: Context API (AuthContext)
- **Testing**: Vitest with jsdom environment
- **Linting**: ESLint with React hooks and refresh plugins

### Backend Stack
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **API Routes**: Node-style API routes (`/api/*`)
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Video Integration**: Daily.co API for video rooms

### Key Dependencies
```json
{
  "@daily-co/daily-js": "^0.87.0",
  "@daily-co/daily-react": "^0.24.0",
  "@supabase/supabase-js": "^2.98.0",
  "react": "^19.2.0",
  "react-router-dom": "^7.13.1"
}
```

## 📁 Project Structure

### Core Directories
```
prime-talk/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Route-based page components
│   ├── lib/                # Business logic and utilities
│   ├── api/                # Frontend API helpers
│   ├── styles/             # CSS-in-JS styles
│   └── test/               # Test setup and utilities
├── api/                    # Server-side API routes
├── supabase/               # Database migrations and functions
└── public/                 # Static assets
```

### Key Components

#### Authentication & Authorization
- **AuthContext**: Centralized auth state management
- **ProtectedRoute**: Route protection based on authentication
- **RoleGuard**: Role-based component rendering
- **AuthGuard**: Authentication verification

#### Lesson Management
- **LessonRoom**: Main video lesson interface with Daily.co integration
- **LessonRoomEngine**: Lesson lifecycle management
- **LessonEngine**: API communication for lesson operations
- **LessonSessions**: Core lesson business logic

#### User Dashboards
- **StudentDashboard**: Student workspace with lesson tracking
- **TeacherDashboard**: Teacher availability and lesson management
- **TeacherStatusControl**: Teacher online/offline status management

#### Scheduling System
- **CalendarSchedule**: Teacher availability calendar
- **StudentBookingCalendar**: Student booking interface
- **ReservationList**: Upcoming and past reservations
- **DurationSelector**: Lesson duration options (5, 10, 25 minutes)

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts (extends auth.users)
- **teacher_availability**: Teacher availability slots
- **lessons**: Lesson records with status tracking
- **reservations**: Scheduled lesson bookings
- **lesson_history**: Completed lesson records
- **lesson_reviews**: Student feedback and ratings
- **profiles**: User profiles and roles
- **student_preferences**: Student learning preferences

### Key Relationships
- Users ↔ Lessons (1:N)
- Teachers ↔ Availability (1:N)
- Lessons ↔ Reservations (1:1)
- Lessons ↔ Reviews (1:1)

### Status Enums
- **Lesson Status**: waiting, active, finished, declined, completed
- **Reservation Status**: pending, confirmed, booked, cancelled, completed
- **Teacher Status**: offline, online, standby, busy

## 🚀 API Endpoints

### Frontend API Routes (`/api/*`)
- **POST /api/create-instant-lesson**: Match student with available teacher
- **POST /api/create-reservation**: Create scheduled lesson
- **POST /api/update-lesson-status**: Update lesson state
- **POST /api/create-daily-room**: Create Daily.co video room

### Supabase Edge Functions
- **create-room**: Daily.co room creation (Deno)
- **create-daily-room**: Alternative room creation
- **create-zoom-meeting**: Zoom integration (alternative)

### API Helper Functions
- **startInstantLesson()**: Instant lesson matching
- **createReservation()**: Scheduled booking
- **updateLessonStatus()**: Status updates
- **activateLessonWithRoom()**: Room activation

## 🎨 UI/UX Features

### Design System
- **Glassmorphism**: Modern frosted glass effects
- **Dark Mode**: Class-based dark theme support
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and fade effects

### Key Pages
- **LandingPage**: Marketing and entry point
- **StudentDashboard**: Student workspace
- **TeacherDashboard**: Teacher management
- **LessonRoom**: Video lesson interface
- **BrowseLessons**: Teacher discovery
- **OnlineTeachers**: Real-time teacher availability

### Interactive Features
- **Real-time Updates**: Live status changes via Supabase Realtime
- **Audio Alerts**: Incoming lesson notifications
- **Video Integration**: Daily.co embedded video rooms
- **Chat System**: Lesson-specific messaging
- **Calendar Integration**: Interactive scheduling

## 🔧 Development Setup

### Environment Variables
```bash
# Frontend
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DAILY_API_KEY=your_daily_api_key

# Backend
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DAILY_API_KEY=your_daily_api_key
```

### Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview build locally
npm run lint     # Code linting
npm run test     # Run tests
```

## 📋 Current Features

### ✅ Completed Features
- **Authentication System**: Supabase Auth integration
- **Role-based Access**: Student/Teacher/Admin roles
- **Instant Lessons**: Real-time teacher matching
- **Scheduled Lessons**: Calendar-based booking system
- **Video Integration**: Daily.co room creation and management
- **Real-time Updates**: Live status and availability tracking
- **Responsive Design**: Mobile-friendly interface
- **Database Schema**: Complete PostgreSQL schema with migrations
- **API Routes**: Server-side API endpoints
- **Edge Functions**: Supabase Edge Functions for room creation

### 🔄 Active Development Areas
- **Teacher Matching Algorithm**: Optimizing instant lesson matching
- **Availability Management**: Teacher scheduling system
- **Lesson History**: Comprehensive lesson tracking
- **Review System**: Student feedback and ratings
- **Notification System**: Enhanced audio/visual alerts

## ⚠️ Known Issues & Bugs

### Database Schema Issues
1. **Migration Conflicts**: Multiple migrations creating similar tables (lessons, reservations)
2. **Column Naming**: Inconsistent column names across tables (room_id vs lesson_id)
3. **RLS Policies**: Some tables missing proper Row Level Security policies

### Frontend Issues
1. **Audio Alert Loop**: Incoming lesson audio may not stop properly
2. **State Synchronization**: Real-time updates may have race conditions
3. **Error Handling**: Some API errors not properly handled in UI
4. **Mobile Responsiveness**: Some components not fully optimized for mobile

### API Issues
1. **Room Creation**: Duplicate room creation attempts
2. **Status Updates**: Race conditions in lesson status updates
3. **Error Responses**: Inconsistent error message formats

### Integration Issues
1. **Daily.co Integration**: Room URL generation inconsistencies
2. **Supabase Realtime**: Subscription management needs improvement
3. **Edge Functions**: Some functions not properly deployed

## 🎯 Missing Features

### High Priority
- **Payment Integration**: Stripe or similar payment processing
- **Teacher Verification**: Application and approval workflow
- **Advanced Scheduling**: Recurring lessons and complex time slots
- **Analytics Dashboard**: Usage statistics and insights

### Medium Priority
- **Push Notifications**: Browser push notifications
- **File Sharing**: Document and media sharing in lessons
- **Screen Sharing**: Enhanced Daily.co features
- **Multi-language Support**: Internationalization

### Low Priority
- **Gamification**: Points, badges, and progress tracking
- **Social Features**: Teacher/student profiles and reviews
- **Mobile App**: Native mobile application
- **AI Features**: Smart scheduling and recommendations

## 🔄 Development Workflow

### Git Workflow
- Main branch: `main`
- Feature branches: `feature/feature-name`
- Pull requests required for all changes

### Database Management
- Migrations: `supabase/migrations/`
- Functions: `supabase/functions/`
- Local development: `supabase start`

### Testing Strategy
- Unit tests: `src/__tests__/`
- Test setup: `src/test/setup.js`
- Coverage: Focus on critical business logic

## 🚀 Deployment

### Frontend Deployment
- **Vercel**: Primary deployment platform
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`

### Backend Deployment
- **Supabase**: Database and auth
- **Edge Functions**: Supabase Edge Functions
- **Environment Variables**: Configured in Supabase dashboard

### CI/CD
- GitHub Actions for automated testing
- Supabase CLI for database migrations
- Vercel for frontend deployment

## 📊 Performance Considerations

### Frontend Optimizations
- Component memoization for expensive calculations
- Lazy loading for heavy components
- Efficient state management to prevent re-renders

### Database Optimizations
- Proper indexing on frequently queried columns
- Connection pooling for API routes
- Query optimization for real-time subscriptions

### Video Performance
- Daily.co room lifecycle management
- Bandwidth optimization for video streams
- Graceful degradation for poor connections

## 🔒 Security Considerations

### Authentication Security
- JWT token management
- Role-based access control
- Session management

### Data Security
- Row Level Security policies
- Input validation and sanitization
- API rate limiting

### Video Security
- Private Daily.co rooms
- Secure room URL generation
- Access control for video sessions

## 📈 Future Roadmap

### Phase 1: MVP Completion
- [ ] Fix all critical bugs
- [ ] Complete teacher verification system
- [ ] Implement payment processing
- [ ] Add comprehensive testing

### Phase 2: Feature Enhancement
- [ ] Advanced scheduling features
- [ ] Enhanced video capabilities
- [ ] Mobile app development
- [ ] Analytics and reporting

### Phase 3: Scale & Optimize
- [ ] Performance optimization
- [ ] Internationalization
- [ ] AI-powered features
- [ ] Enterprise features

## 🛠️ Development Tips

### Working with Supabase
- Use `supabase.auth.getUser()` for auth state
- Leverage real-time subscriptions for live updates
- Follow RLS best practices for security

### Working with Daily.co
- Always handle room creation errors
- Implement proper cleanup on component unmount
- Use Daily.co's event system for state management

### Working with React
- Use Context for global state (auth, user data)
- Implement proper error boundaries
- Optimize renders with memoization

### Debugging Tips
- Check browser console for API errors
- Monitor network requests for failed calls
- Use Supabase dashboard for real-time data inspection
- Test edge functions locally with `supabase functions serve`

## 📞 Support & Maintenance

### Monitoring
- Supabase dashboard for database health
- Vercel analytics for frontend performance
- Daily.co dashboard for video usage

### Maintenance Tasks
- Regular dependency updates
- Database migration management
- Edge function deployment
- Security audit reviews

### Troubleshooting
- Check environment variables first
- Verify Supabase project configuration
- Test API routes independently
- Monitor real-time subscriptions

---

**Last Updated**: March 9, 2026
**Version**: Prime Talk v1.0 (MVP)
**Status**: Active Development