import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/auth/AuthForm";
import { AlertCircle } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Secure Grievance Portal
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Campus Grievance
              <span className="block text-primary mt-2">Redressal System</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              A centralized platform for students to submit and track complaints with
              complete transparency, multilingual support, and real-time updates.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Always Available</div>
              </div>
              <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-muted-foreground">Secure & Private</div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="flex justify-center md:justify-end">
            <AuthForm />
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2025 Campus Grievance Portal. All rights reserved.
      </footer>
    </div>
  );
}