import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlanProvider } from './contexts/PlanContext';
import { ModalProvider } from './contexts/ModalContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Plan from './pages/Plan';
import Calendar from './pages/Calendar';
import History from './pages/History';
import Profile from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="plan" element={<Plan />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <PlanProvider>
          <Router>
            <AppRoutes />
          </Router>
        </PlanProvider>
      </ModalProvider>
    </AuthProvider>
  );
}
