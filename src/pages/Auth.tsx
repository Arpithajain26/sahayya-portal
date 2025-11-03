import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Shield, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-campus.jpg";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginType, setLoginType] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Admin login with hardcoded credentials
      if (loginType === "admin") {
        if (email !== "admin@college.edu.in" || password !== "admin123") {
          throw new Error("Invalid admin credentials");
        }
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Admin logged in successfully!");
        return;
      }

      // Student signup/login
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Assign student role by default
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: data.user.id,
              role: "student",
            });

          if (roleError) {
            console.error("Role assignment error:", roleError);
          }

          toast.success("Account created successfully!");
        }
      } else {
        // Student login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Logged in successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Hero Image & Branding */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <img
          src={heroImage}
          alt="Campus Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />

        <div className="relative h-full flex flex-col justify-between p-8 lg:p-12 min-h-[300px] lg:min-h-screen">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold">Campus Portal</span>
          </div>

          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Trusted by Students & Faculty
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Campus Grievance
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mt-2">
                Redressal Portal
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              A secure, transparent platform for submitting and tracking campus
              grievances with multilingual support and real-time updates.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm hover-scale">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">
                  Always Available
                </div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm hover-scale">
                <div className="text-3xl font-bold text-primary mb-1">
                  100%
                </div>
                <div className="text-sm text-muted-foreground">
                  Secure & Private
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 Campus Grievance Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 lg:p-12 bg-background">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {loginType === "admin" 
                  ? "Admin Login" 
                  : mode === "login" ? "Student Login" : "Student Registration"}
              </CardTitle>
              <Badge variant={loginType === "admin" ? "default" : "secondary"}>
                {loginType === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                {loginType === "admin" ? "Admin" : "Student"}
              </Badge>
            </div>
            <CardDescription>
              {loginType === "admin"
                ? "Use admin credentials to access dashboard"
                : mode === "login"
                ? "Sign in to access your dashboard"
                : "Register as a new student"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Type Selector */}
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={loginType === "student" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setLoginType("student")}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Student
              </Button>
              <Button
                type="button"
                variant={loginType === "admin" ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  setLoginType("admin");
                  setMode("login"); // Admin can only login
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && loginType === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {loginType === "student" && (
              <div className="mt-4 text-center text-sm">
                {mode === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setMode("signup")}
                    >
                      Sign up
                    </Button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </Button>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}