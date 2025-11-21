import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/authService';
import { connectSTOMP, disconnectSTOMP } from './services/stompService';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ReportCreate from './pages/ReportCreate';
import ReportDetail from './pages/ReportDetail';
import Family from './pages/Family';
import FamilyMembers from './pages/FamilyMembers';
import DangerZones from './pages/DangerZones';
import SOS from './pages/SOS';
import NotFound from './pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  // Global WebSocket connection - connect once when app loads
  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      console.log('[App] Connecting to WebSocket with userId:', userId);
      connectSTOMP(userId)
        .then(() => {
          console.log('✅ [App] Global WebSocket connected successfully');
        })
        .catch((error) => {
          console.error('❌ [App] WebSocket connection failed:', error);
        });
    } else {
      console.log('[App] No userId found, skipping WebSocket connection');
    }

    // Cleanup: disconnect when app unmounts
    return () => {
      if (userId) {
        console.log('[App] Disconnecting WebSocket');
        disconnectSTOMP();
      }
    };
  }, []); // Run once on mount

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/create"
          element={
            <ProtectedRoute>
              <ReportCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <ReportDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family"
          element={
            <ProtectedRoute>
              <Family />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family/members"
          element={
            <ProtectedRoute>
              <FamilyMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/danger-zones"
          element={
            <ProtectedRoute>
              <DangerZones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sos"
          element={
            <ProtectedRoute>
              <SOS />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
