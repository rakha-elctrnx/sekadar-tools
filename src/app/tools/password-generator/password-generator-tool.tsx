"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Key,
  AlertCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToolDetailHeader } from "@/components/tool-detail-header";

const charset = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  number: "0123456789",
  symbol: "!@#$%^&*()_+-=[]{}|;:',.<>/?`~",
};

function generatePassword(
  length: number,
  useLower: boolean,
  useUpper: boolean,
  useNumber: boolean,
  useSymbol: boolean
): string {
  let chars = "";
  if (useLower) chars += charset.lower;
  if (useUpper) chars += charset.upper;
  if (useNumber) chars += charset.number;
  if (useSymbol) chars += charset.symbol;
  if (!chars) return "";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function getPasswordStrength(
  password: string,
  length: number
): { label: string; color: string; bgColor: string; width: string; icon: typeof Shield } {
  if (!password)
    return { label: "No password", color: "text-muted-foreground", bgColor: "bg-muted", width: "0%", icon: Shield };

  let score = 0;
  if (length >= 12) score++;
  if (length >= 16) score++;
  if (length >= 20) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 3)
    return { label: "Weak", color: "text-red-500", bgColor: "bg-red-500", width: "33%", icon: ShieldAlert };
  if (score <= 5)
    return { label: "Medium", color: "text-yellow-500", bgColor: "bg-yellow-500", width: "66%", icon: Shield };
  return { label: "Strong", color: "text-emerald-500", bgColor: "bg-emerald-500", width: "100%", icon: ShieldCheck };
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generateAndSetPassword = useCallback(() => {
    const newPassword = generatePassword(length, useLower, useUpper, useNumber, useSymbol);
    setPassword(newPassword);
  }, [length, useLower, useUpper, useNumber, useSymbol]);

  useEffect(() => {
    generateAndSetPassword();
  }, [generateAndSetPassword]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = getPasswordStrength(password, length);
  const StrengthIcon = strength.icon;
  const noOptionSelected = !useLower && !useUpper && !useNumber && !useSymbol;

  const charOptions = [
    { id: "lower", label: "Lowercase (a-z)", checked: useLower, onChange: setUseLower },
    { id: "upper", label: "Uppercase (A-Z)", checked: useUpper, onChange: setUseUpper },
    { id: "number", label: "Numbers (0-9)", checked: useNumber, onChange: setUseNumber },
    { id: "symbol", label: "Symbols (!@#$)", checked: useSymbol, onChange: setUseSymbol },
  ];

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Password Generator"
        description="Generate secure random passwords with customizable length and character options"
        icon={Key}
      />

      {/* Generated Password Display */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Generated Password</Label>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="xs"
              onClick={generateAndSetPassword}
              className="h-7 gap-1.5 px-2 text-xs text-[#c5030c] hover:text-[#c5030c]"
            >
              <RefreshCw className="size-3" />
              Regenerate
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
            <span className="flex-1 select-all break-all font-mono text-base font-semibold tracking-wide sm:text-lg">
              {password || "—"}
            </span>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleCopy}
              disabled={!password}
              title={copied ? "Copied!" : "Copy password"}
              className="shrink-0"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Strength Meter */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password Strength</span>
              <span className={`flex items-center gap-1 font-semibold ${strength.color}`}>
                <StrengthIcon className="size-3.5" />
                {strength.label}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${strength.bgColor} transition-all duration-300`}
                style={{ width: strength.width }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
        <h2 className="text-sm font-semibold">Configuration</h2>

        {/* Length Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="password-length" className="text-sm font-medium">
              Password Length
            </Label>
            <Badge variant="secondary" className="font-mono text-xs tabular-nums">
              {length}
            </Badge>
          </div>
          <input
            id="password-length"
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c5030c] [&::-webkit-slider-thumb]:shadow-sm"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        {/* Character Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Character Types</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {charOptions.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5 transition-colors hover:bg-muted/40 has-[:checked]:border-[#c5030c]/30 has-[:checked]:bg-[#c5030c]/5"
              >
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={(e) => option.onChange(e.target.checked)}
                  className="size-4 rounded border-border accent-[#c5030c]"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Warning */}
        {noOptionSelected && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
            <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
            <span className="text-xs font-medium text-destructive">
              Select at least one character type to generate a password.
            </span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">About Password Security</h2>
        <div className="grid gap-4 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Client-side Generation:</strong>{" "}
              Passwords are generated entirely in your browser using the Web Crypto API.
              No data is sent to any server.
            </p>
            <p>
              <strong className="text-foreground">Recommended Length:</strong>{" "}
              Use at least 16 characters with a mix of all character types for strong security.
              Longer passwords are exponentially harder to crack.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Entropy:</strong>{" "}
              Password strength depends on both length and character pool size.
              A 16-character password with all types has approximately 105 bits of entropy.
            </p>
            <p>
              <strong className="text-foreground">Best Practices:</strong>{" "}
              Use a unique password for every account. Consider using a password manager
              to store and organize your credentials securely.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-[11px] font-normal">
            Web Crypto API
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            Client-side Only
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            No Data Sent
          </Badge>
        </div>
      </div>
    </div>
  );
}
