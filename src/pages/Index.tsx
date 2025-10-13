import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, MessageSquare, Globe } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Campus Grievance Portal</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Trusted by Students Across Campus
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Your Voice Matters.
            <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
              Make It Heard.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A secure, transparent platform for students to submit grievances,
            track their progress, and receive timely resolutions—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Submit a Complaint
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View My Complaints
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with students in mind, designed for efficiency and transparency
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your complaints are protected with enterprise-grade security and privacy
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-muted-foreground">
                Track your complaint status with live updates from submission to resolution
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Submission</h3>
              <p className="text-muted-foreground">
                Simple forms with image upload, categorization, and location tagging
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multilingual Support</h3>
              <p className="text-muted-foreground">
                Future support for Kannada translation and audio playback for accessibility
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-primary-foreground/80">
                  Always Available
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-primary-foreground/80">
                  Secure & Encrypted
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Fast</div>
                <div className="text-primary-foreground/80">
                  Response Times
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of students who are making campus life better through
            transparent grievance resolution.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Campus Grievance Portal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}