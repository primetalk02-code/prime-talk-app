import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import StudentLogin from './pages/StudentLogin'
import TeacherLogin from './pages/TeacherLogin'
import StudentDashboard from './pages/StudentDashboard'
import OnlineTeachers from './pages/OnlineTeachers'
import Textbook from './pages/Textbook'
import BrowseLessons from './pages/BrowseLessons'
import LessonDetails from './pages/LessonDetails'
import LessonRoom from './pages/LessonRoom'
import VideoLesson from './pages/VideoLesson'
import CreateLesson from './pages/CreateLesson'
import ApplyTeacher from './pages/ApplyTeacher'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherSchedule from './pages/TeacherSchedule'
import TeacherReservations from './pages/TeacherReservations'
import TeacherLessons from './pages/TeacherLessons'
import TeacherEarnings from './pages/TeacherEarnings'
import TeacherProfile from './pages/TeacherProfile'
import TeacherHistory from './pages/TeacherHistory'
import TeacherReviews from './pages/TeacherReviews'
import TeacherMessages from './pages/TeacherMessages'
import TeacherAccount from './pages/TeacherAccount'
import StudentLessons from './pages/StudentLessons'
import StudentMessages from './pages/StudentMessages'
import StudentPreferences from './pages/StudentPreferences'
import StudentAccount from './pages/StudentAccount'
import StudentReservations from './pages/StudentReservations'
import StudentReviews from './pages/StudentReviews'
import RoleGuard from './components/RoleGuard'
import ProtectedRoute from './components/ProtectedRoute'
import TeacherLayout from './components/TeacherLayout'
import StudentLayout from './components/StudentLayout'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="book-lesson" element={<BrowseLessons />} />
          <Route path="online-teachers" element={<OnlineTeachers />} />
          <Route path="reservations" element={<StudentReservations />} />
          <Route path="lessons" element={<StudentLessons />} />
          <Route path="reviews" element={<StudentReviews />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="preferences" element={<StudentPreferences />} />
          <Route path="account" element={<StudentAccount />} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Route>
        <Route path="/textbook" element={<Textbook />} />
        <Route path="/browse-lessons" element={<Navigate to="/student/book-lesson" replace />} />
        <Route path="/lesson-details/:id" element={<LessonDetails />} />
        <Route path="/lesson/:roomId" element={<LessonRoom />} />
        <Route path="/lesson-room/:reservationId" element={<LessonRoom />} />
        <Route
          path="/video-lesson/:lessonId"
          element={
            <ProtectedRoute>
              <VideoLesson />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="reservations" element={<TeacherReservations />} />
          <Route path="schedule" element={<TeacherSchedule />} />
          <Route path="history" element={<TeacherHistory />} />
          <Route path="reviews" element={<TeacherReviews />} />
          <Route path="messages" element={<TeacherMessages />} />
          <Route path="account" element={<TeacherAccount />} />
          <Route path="lessons" element={<TeacherLessons />} />
          <Route path="earnings" element={<TeacherEarnings />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
        </Route>
        <Route path="/apply-teacher" element={<ApplyTeacher />} />
        <Route
          path="/create-lesson"
          element={
            <RoleGuard allowedRole="admin">
              <CreateLesson />
            </RoleGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
