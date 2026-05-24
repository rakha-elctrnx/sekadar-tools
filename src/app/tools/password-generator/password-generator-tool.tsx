"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

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
) {
  let chars = "";
  if (useLower) chars += charset.lower;
  if (useUpper) chars += charset.upper;
  if (useNumber) chars += charset.number;
  if (useSymbol) chars += charset.symbol;
  if (!chars) return "";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function getPasswordStrength(password: string, length: number): { label: string; color: string; width: string } {
  if (!password) return { label: "No password", color: "bg-gray-300", width: "0%" };
  let score = 0;
  if (length >= 12) score++;
  if (length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "bg-yellow-500", width: "66%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(12);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumber, setUseNumber] = useState(true);
  const [useSymbol, setUseSymbol] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generateAndSetPassword = useCallback(() => {
    const newPassword = generatePassword(length, useLower, useUpper, useNumber, useSymbol);
    setPassword(newPassword);
  }, [length, useLower, useUpper, useNumber, useSymbol]);

  // Auto-generate whenever any dependency changes
  useEffect(() => {
    generateAndSetPassword();
  }, [generateAndSetPassword]);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = getPasswordStrength(password, length);
  const noOptionSelected = !useLower && !useUpper && !useNumber && !useSymbol;

  return (
    <div className="flex items-center justify-center p-4 mt-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Password field with copy button */}
        <div className="relative">
          <input
            type="text"
            readOnly
            value={password}
            className="w-full px-4 py-3 pr-12 text-lg font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#c5030c] outline-none transition"
            placeholder="Your password will appear here"
          />
          <button
            onClick={handleCopy}
            disabled={!password}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 text-gray-500 hover:text-[#c5030c]"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {/* Strength meter */}
        {password && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Password strength</span>
              <span className="font-semibold" style={{ color: strength.color.replace("bg-", "text-") }}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all duration-300`}
                style={{ width: strength.width }}
              />
            </div>
          </div>
        )}

        {/* Length slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password length: <span className="font-bold text-[#c5030c]">{length}</span>
          </label>
          <input
            type="range"
            min={4}
            max={50}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: "#c5030c" }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>4</span>
            <span>50</span>
          </div>
        </div>

        {/* Character options */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white border border-gray-200 hover:border-[#c5030c] transition cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-[#c5030c]"
              style={{ accentColor: "#c5030c" }}
            />
            <span className="text-sm">a-z (lowercase)</span>
          </label>
          <label className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white border border-gray-200 hover:border-[#c5030c] transition cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-[#c5030c]"
              style={{ accentColor: "#c5030c" }}
            />
            <span className="text-sm">A-Z (uppercase)</span>
          </label>
          <label className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white border border-gray-200 hover:border-[#c5030c] transition cursor-pointer">
            <input
              type="checkbox"
              checked={useNumber}
              onChange={(e) => setUseNumber(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-[#c5030c]"
              style={{ accentColor: "#c5030c" }}
            />
            <span className="text-sm">0-9 (numbers)</span>
          </label>
          <label className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white border border-gray-200 hover:border-[#c5030c] transition cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbol}
              onChange={(e) => setUseSymbol(e.target.checked)}
              className="w-4 h-4 rounded focus:ring-[#c5030c]"
              style={{ accentColor: "#c5030c" }}
            />
            <span className="text-sm">!@# (symbols)</span>
          </label>
        </div>

        {/* Warning when no option selected */}
        {noOptionSelected && (
          <div className="flex items-center gap-2 text-sm text-[#c5030c] bg-red-50 p-3 rounded-lg">
            <AlertCircle size={18} />
            <span>Select at least one character type</span>
          </div>
        )}
      </div>
    </div>
  );
}