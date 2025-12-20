import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check, QrCode } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

export function TwoFactorSetup({ onSetupComplete }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error("Error checking MFA status:", error);
        return;
      }

      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      setMfaEnabled(!!totpFactor);
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    } catch (error) {
      console.error("Error checking MFA:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleEnrollMfa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Admin 2FA'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setShowSetup(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (verifyCode.length !== 6 || !factorId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) throw error;

      toast.success("Two-factor authentication enabled successfully!");
      setMfaEnabled(true);
      setShowSetup(false);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");
      onSetupComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!factorId) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      toast.success("Two-factor authentication disabled");
      setMfaEnabled(false);
      setFactorId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret copied to clipboard");
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your admin account
              </CardDescription>
            </div>
          </div>
          <Badge variant={mfaEnabled ? "default" : "secondary"}>
            {mfaEnabled ? (
              <>
                <ShieldCheck className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <ShieldOff className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {mfaEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
                  <DialogDescription>
                    This will remove the extra security layer from your account. Are you sure you want to continue?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => {}}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDisableMfa} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : showSetup ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </div>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Or enter this secret manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Enter verification code from your app</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verifyCode}
                  onChange={(value) => setVerifyCode(value)}
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
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSetup(false);
                  setQrCode(null);
                  setSecret(null);
                  setVerifyCode("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyMfa} 
                disabled={loading || verifyCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Protect your admin account by requiring a verification code from your authenticator app in addition to your password.
            </p>
            <Button onClick={handleEnrollMfa} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Set Up 2FA
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
