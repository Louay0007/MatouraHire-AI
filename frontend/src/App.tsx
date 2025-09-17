import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Resume from "./pages/Resume";
import Interview from "./pages/Interview";
import JobMatcher from "./pages/JobMatcher";
import Footprint from "./pages/Footprint";
import Report from "./pages/Report";
import Profile from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ai-career-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Auth Routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/resume" element={
                  <ProtectedRoute>
                    <Resume />
                  </ProtectedRoute>
                } />
                <Route path="/interview" element={
                  <ProtectedRoute>
                    <Interview />
                  </ProtectedRoute>
                } />
                <Route path="/job-matcher" element={
                  <ProtectedRoute>
                    <JobMatcher />
                  </ProtectedRoute>
                } />
                <Route path="/footprint" element={
                  <ProtectedRoute>
                    <Footprint />
                  </ProtectedRoute>
                } />
                <Route path="/report" element={
                  <ProtectedRoute>
                    <Report />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
