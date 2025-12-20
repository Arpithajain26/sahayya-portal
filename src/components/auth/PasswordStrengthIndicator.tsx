import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const criteria: PasswordCriteria[] = useMemo(() => [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = criteria.filter(c => c.met).length;
    if (metCount <= 2) return { level: "weak", label: "Weak", color: "bg-destructive" };
    if (metCount <= 3) return { level: "medium", label: "Medium", color: "bg-yellow-500" };
    if (metCount <= 4) return { level: "good", label: "Good", color: "bg-blue-500" };
    return { level: "strong", label: "Strong", color: "bg-green-500" };
  }, [criteria]);

  const strengthPercentage = useMemo(() => {
    const metCount = criteria.filter(c => c.met).length;
    return (metCount / criteria.length) * 100;
  }, [criteria]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength.level === "weak" && "text-destructive",
            strength.level === "medium" && "text-yellow-500",
            strength.level === "good" && "text-blue-500",
            strength.level === "strong" && "text-green-500"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      <div className="grid grid-cols-1 gap-1">
        {criteria.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              item.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {item.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
