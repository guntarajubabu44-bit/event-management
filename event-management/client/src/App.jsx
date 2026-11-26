import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedLayout from './components/ProtectedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import EventCreate from './pages/EventCreate'
import EventDetails from './pages/EventDetails'
import EventEdit from './pages/EventEdit'
import Events from './pages/Events'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import PublicEvent from './pages/PublicEvent'
import BookingHistory from './pages/BookingHistory'
import BookingDetails from './pages/BookingDetails'
import Settings from './pages/Settings'
import HomePage from './pages/HomePage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminCustomers from './pages/AdminCustomers'
import ExploreEvents from './pages/ExploreEvents'
import AdminBookings from './pages/AdminBookings'
import AdminCategories from './pages/AdminCategories'
import PaymentHistory from './pages/PaymentHistory'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminContact from './pages/AdminContact'
import AdminReviews from './pages/AdminReviews'
import AdminCoupons from './pages/AdminCoupons'
import AdminOrganizers from './pages/AdminOrganizers'
import Notifications from './pages/Notifications'
import AdminFinance from './pages/AdminFinance'
import AdminContent from './pages/AdminContent'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/new" element={<EventCreate />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/events/:id/edit" element={<EventEdit />} />
                <Route path="/bookings" element={<BookingHistory />} />
                <Route path="/bookings/:bookingRef" element={<BookingDetails />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/organizers" element={<AdminOrganizers />} />
                <Route path="/admin/finance" element={<AdminFinance />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/contact" element={<AdminContact />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
              </Route>
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/public/events/:publicId" element={<PublicEvent />} />
            <Route path="/explore" element={<ExploreEvents />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
