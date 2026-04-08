import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Chat from "./pages/Chat.tsx";
import Report from "./pages/Report.tsx";
import AssessmentStart from "./pages/AssessmentStart.tsx";
import AssessmentInterview from "./pages/AssessmentInterview.tsx";
import AssessmentResults from "./pages/AssessmentResults.tsx";
import DoctorDashboard from "./pages/DoctorDashboard.tsx";
import ClinicalReport from "./pages/ClinicalReport.tsx";
import TestClinicalReport from "./pages/TestClinicalReport.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/:sessionId" 
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assessment/start" 
            element={
              <ProtectedRoute>
                <AssessmentStart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assessment/interview/:type" 
            element={
              <ProtectedRoute>
                <AssessmentInterview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assessment/results/:sessionId" 
            element={
              <ProtectedRoute>
                <AssessmentResults />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clinical-report/:sessionId" 
            element={
              <ProtectedRoute>
                <ClinicalReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-clinical-report" 
            element={
              <TestClinicalReport />
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
