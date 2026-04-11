import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import VotingPage from "./pages/VotingPage";
import EventsPage from "./pages/EventsPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import ProjectsPage from "./pages/ProjectsPage";
import MeetingsPage from "./pages/MeetingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="voting" element={<VotingPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
