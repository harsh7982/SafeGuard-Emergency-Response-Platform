import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ReportIncident from "./pages/ReportIncident";
import LiveTracking from "./pages/LiveTracking";
import AIAssistant from "./pages/AiAssistant";
import IncidentHistory from "./pages/IncidentHistory";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import GuardianTwin from "./pages/GuardianTwin";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import { ToastProvider } from "./components/Toast";
import { GuardianProtectionProvider } from "./context/GuardianProtection";
import "./styles/motion.css";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <GuardianProtectionProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/report" element={<ReportIncident />} />
                  <Route path="/report-incident" element={<ReportIncident />} />
                  <Route path="/tracking" element={<LiveTracking />} />
                  <Route path="/ai" element={<AIAssistant />} />
                  <Route path="/guardian-twin" element={<GuardianTwin />} />
                  <Route path="/history" element={<IncidentHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
              </Route>
            </Routes>
          </GuardianProtectionProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
