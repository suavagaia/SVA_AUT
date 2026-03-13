import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuards";

// Pages
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

// Auth
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import UpdatePasswordPage from "@/pages/auth/UpdatePasswordPage";
import ConfirmPage from "@/pages/auth/ConfirmPage";

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

// Thank You
import ThankYouMonthly from "@/pages/thankyou/ThankYouMonthly";
import ThankYouAnnual from "@/pages/thankyou/ThankYouAnnual";
import ThankYouTest from "@/pages/thankyou/ThankYouTest";
import ThankYouCredits from "@/pages/thankyou/ThankYouCredits";

// Legal
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth - public only */}
            <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/auth/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
            <Route path="/auth/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
            <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
            <Route path="/auth/confirm" element={<ConfirmPage />} />

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

            {/* Thank You - public */}
            <Route path="/thank-you/monthly" element={<ThankYouMonthly />} />
            <Route path="/thank-you/annual" element={<ThankYouAnnual />} />
            <Route path="/thank-you/test" element={<ThankYouTest />} />
            <Route path="/thank-you/credits" element={<ThankYouCredits />} />

            {/* Legal */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
