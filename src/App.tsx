import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import VotingPage from "./pages/VotingPage";
import ElectionPage from "./pages/ElectionPage";
import EventsPage from "./pages/EventsPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import MembersPage from "./pages/MembersPage";
import ProjectsPage from "./pages/ProjectsPage";
import MeetingsPage from "./pages/MeetingsPage";
import RecordPage from "./pages/RecordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="voting" element={<VotingPage />} />
              <Route path="elections" element={<ElectionPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="applicants" element={<ApplicantsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="meetings" element={<MeetingsPage />} />
              <Route path="records" element={<RecordPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
