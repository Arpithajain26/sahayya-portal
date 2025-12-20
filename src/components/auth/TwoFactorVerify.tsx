import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorVerifyProps {
  factorId: string;
  onVerified: () => void;
  onBack: () => void;
}

export function TwoFactorVerify({ factorId, onVerified, onBack }: TwoFactorVerifyProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    try {
      // Create challenge first
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Then verify the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
      });

      if (error) throw error;

      toast.success("Two-factor authentication verified!");
      onVerified();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md animate-scale-in">
      <CardHeader className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
              onComplete={handleVerify}
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

          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Open your authenticator app and enter the current code for your account
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
