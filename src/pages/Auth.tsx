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
import { toast } from "sonner";
import { Loader2, Shield, UserCheck, ArrowLeft, Mail, RefreshCw, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-campus.jpg";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthMode = "login" | "signup" | "verify-otp" | "forgot-password" | "reset-password";

interface LoginAttemptData {
  attempts: number;
  lockoutUntil: number | null;
  lastAttempt: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes window for attempt tracking

const getLoginAttempts = (email: string): LoginAttemptData => {
  const key = `login_attempts_${email.toLowerCase()}`;
  const data = localStorage.getItem(key);
  if (!data) {
    return { attempts: 0, lockoutUntil: null, lastAttempt: 0 };
  }
  try {
    const parsed = JSON.parse(data);
    // Reset attempts if window has passed
    if (Date.now() - parsed.lastAttempt > ATTEMPT_WINDOW_MS) {
      return { attempts: 0, lockoutUntil: null, lastAttempt: 0 };
    }
    return parsed;
  } catch {
    return { attempts: 0, lockoutUntil: null, lastAttempt: 0 };
  }
};

const setLoginAttempts = (email: string, data: LoginAttemptData) => {
  const key = `login_attempts_${email.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(data));
};

const clearLoginAttempts = (email: string) => {
  const key = `login_attempts_${email.toLowerCase()}`;
  localStorage.removeItem(key);
};

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginType, setLoginType] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Handle password recovery event only
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lockout timer
  useEffect(() => {
    if (lockoutRemaining > 0) {
      const timer = setTimeout(() => setLockoutRemaining(lockoutRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutRemaining]);

  // Check lockout status when email changes
  useEffect(() => {
    if (email && mode === "login") {
      const attemptData = getLoginAttempts(email);
      if (attemptData.lockoutUntil && attemptData.lockoutUntil > Date.now()) {
        const remaining = Math.ceil((attemptData.lockoutUntil - Date.now()) / 1000);
        setLockoutRemaining(remaining);
      } else {
        setLockoutRemaining(0);
      }
    }
  }, [email, mode]);

  const checkAndUpdateAttempts = (email: string, isFailure: boolean): { isLocked: boolean; attemptsLeft: number } => {
    const attemptData = getLoginAttempts(email);
    
    // Check if currently locked out
    if (attemptData.lockoutUntil && attemptData.lockoutUntil > Date.now()) {
      const remaining = Math.ceil((attemptData.lockoutUntil - Date.now()) / 1000);
      setLockoutRemaining(remaining);
      return { isLocked: true, attemptsLeft: 0 };
    }

    if (isFailure) {
      const newAttempts = attemptData.attempts + 1;
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLoginAttempts(email, { attempts: newAttempts, lockoutUntil, lastAttempt: Date.now() });
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        return { isLocked: true, attemptsLeft: 0 };
      }
      
      setLoginAttempts(email, { attempts: newAttempts, lockoutUntil: null, lastAttempt: Date.now() });
      return { isLocked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - newAttempts };
    }

    // Success - clear attempts
    clearLoginAttempts(email);
    setLockoutRemaining(0);
    return { isLocked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lockout for login attempts
    if (mode === "login" || loginType === "admin") {
      const attemptData = getLoginAttempts(email);
      if (attemptData.lockoutUntil && attemptData.lockoutUntil > Date.now()) {
        const remaining = Math.ceil((attemptData.lockoutUntil - Date.now()) / 1000);
        setLockoutRemaining(remaining);
        toast.error(`Account temporarily locked. Try again in ${Math.ceil(remaining / 60)} minutes.`);
        return;
      }
    }
    
    setLoading(true);
    setIsSubmitting(true);

    try {
      // Admin login
      if (loginType === "admin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const result = checkAndUpdateAttempts(email, true);
          if (result.isLocked) {
            throw new Error("Too many failed login attempts. Account locked for 15 minutes.");
          }
          if (error.message.includes("Invalid login credentials")) {
            throw new Error(`Invalid email or password. ${result.attemptsLeft} attempts remaining.`);
          }
          throw new Error(error.message);
        }

        if (!data.user) {
          checkAndUpdateAttempts(email, true);
          throw new Error("Login failed. Please try again.");
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          await supabase.auth.signOut();
          checkAndUpdateAttempts(email, true);
          throw new Error("Access denied. This account does not have admin privileges.");
        }

        // Success - clear attempts
        checkAndUpdateAttempts(email, false);
        toast.success("Admin logged in successfully!");
        navigate("/admin");
        return;
      }

      // Student signup
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/auth`;

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
          setPendingUserId(data.user.id);
          setMode("verify-otp");
          setResendCooldown(60);
          toast.success("Verification code sent to your email!");
        }
      } else {
        // Student login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const result = checkAndUpdateAttempts(email, true);
          if (result.isLocked) {
            throw new Error("Too many failed login attempts. Account locked for 15 minutes.");
          }
          if (error.message.includes("Email not confirmed")) {
            setPendingUserId(data?.user?.id || null);
            setMode("verify-otp");
            toast.info("Please verify your email first.");
            return;
          }
          if (error.message.includes("Invalid login credentials")) {
            throw new Error(`Invalid email or password. ${result.attemptsLeft} attempts remaining.`);
          }
          throw error;
        }
        
        // Success - clear attempts
        checkAndUpdateAttempts(email, false);
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      if (data.user) {
        // Assign student role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: "student",
          });

        if (roleError) {
          console.error("Role assignment error:", roleError);
        }

        toast.success("Email verified successfully! Welcome!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;
      
      setResendCooldown(60);
      toast.success("Verification code resent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      
      toast.success("Password reset link sent to your email!");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      toast.success("Password updated successfully!");
      setMode("login");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const renderAuthForm = () => {
    // OTP Verification Form
    if (mode === "verify-otp") {
      return (
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2"
              onClick={() => setMode("signup")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Verify Email</CardTitle>
                <CardDescription>Enter the 6-digit code sent to {email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm"
                >
                  {resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    }

    // Forgot Password Form
    if (mode === "forgot-password") {
      return (
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2"
              onClick={() => setMode("login")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    }

    // Reset Password Form
    if (mode === "reset-password") {
      return (
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    }

    // Login/Signup Form
    return (
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
                setMode("login");
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>

          {/* Lockout Warning */}
          {lockoutRemaining > 0 && mode === "login" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mb-4">
              <Lock className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Account temporarily locked</p>
                <p className="text-xs opacity-80">
                  Too many failed attempts. Try again in {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {loginType === "student" && mode === "login" && (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => setMode("forgot-password")}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
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

            <Button type="submit" className="w-full" disabled={loading || (lockoutRemaining > 0 && mode === "login")}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : lockoutRemaining > 0 && mode === "login" ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Locked
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
    );
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
        {renderAuthForm()}
      </div>
    </div>
  );
}