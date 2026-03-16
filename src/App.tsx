import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StudyTimerProvider } from "@/contexts/StudyTimerContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuards";

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : <LandingPage />;
}

// Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

// Auth
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ResetPasswordPage";
import NewPasswordPage from "@/pages/auth/NewPasswordPage";
import UpdatePasswordPage from "@/pages/auth/UpdatePasswordPage";
import ConfirmPage from "@/pages/auth/ConfirmPage";
import Setup2FAPage from "@/pages/auth/Setup2FAPage";
import Verify2FAPage from "@/pages/auth/Verify2FAPage";

// App
import AreasPage from "@/pages/app/AreasPage";
import ContestsPage from "@/pages/app/ContestsPage";
import SubjectsPage from "@/pages/app/SubjectsPage";
import AgentsPage from "@/pages/app/AgentsPage";
import UpgradePage from "@/pages/app/UpgradePage";
import ChatPage from "@/pages/app/ChatPage";
import BillingPage from "@/pages/app/BillingPage";
import HistoryPage from "@/pages/app/HistoryPage";
import SettingsPage from "@/pages/app/SettingsPage";
import SchedulePage from "@/pages/app/SchedulePage";
import MentoriaPage from "@/pages/app/MentoriaPage";
import ManualPage from "@/pages/app/ManualPage";

// Thank You
import ThankYouMonthly from "@/pages/thankyou/ThankYouMonthly";
import ThankYouAnnual from "@/pages/thankyou/ThankYouAnnual";
import ThankYouTest from "@/pages/thankyou/ThankYouTest";
import ThankYouCredits from "@/pages/thankyou/ThankYouCredits";

// Legal
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";

// Admin
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminUsersPage from "@/pages/admin/UsersPage";
import AdminPromptsPage from "@/pages/admin/PromptsPage";
import AdminInteractionsPage from "@/pages/admin/InteractionsPage";
import AdminVectorStoresPage from "@/pages/admin/VectorStoresPage";
import AdminAreasPage from "@/pages/admin/AreasPage";
import AdminContestsPage from "@/pages/admin/ContestsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <StudyTimerProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingRoute />} />

            {/* Auth - public only */}
            <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/auth/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
            <Route path="/auth/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/auth/reset-password" element={<NewPasswordPage />} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/auth/confirm" element={<ConfirmPage />} />
            <Route path="/setup-2fa" element={<Setup2FAPage />} />
            <Route path="/verify-2fa" element={<Verify2FAPage />} />

            {/* App - protected */}
            <Route path="/app" element={<Navigate to="/app/areas" replace />} />
            <Route path="/app/areas" element={<ProtectedRoute><AreasPage /></ProtectedRoute>} />
            <Route path="/app/contests/:areaSlug" element={<ProtectedRoute><ContestsPage /></ProtectedRoute>} />
            <Route path="/app/subjects/:contestId" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
            <Route path="/app/agents/:subjectId" element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
            <Route path="/app/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/app/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />
            <Route path="/app/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
            <Route path="/app/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/app/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/app/mentoria" element={<ProtectedRoute><MentoriaPage /></ProtectedRoute>} />
            <Route path="/app/manual" element={<ProtectedRoute><ManualPage /></ProtectedRoute>} />

            {/* Thank You - public */}
            <Route path="/thank-you/monthly" element={<ThankYouMonthly />} />
            <Route path="/thank-you/annual" element={<ThankYouAnnual />} />
            <Route path="/thank-you/test" element={<ThankYouTest />} />
            <Route path="/thank-you/credits" element={<ThankYouCredits />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/prompts" element={<AdminPromptsPage />} />
            <Route path="/admin/interactions" element={<AdminInteractionsPage />} />
            <Route path="/admin/vector-stores" element={<AdminVectorStoresPage />} />
            <Route path="/admin/areas" element={<AdminAreasPage />} />
            <Route path="/admin/contests" element={<AdminContestsPage />} />

            {/* Legal */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </StudyTimerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
