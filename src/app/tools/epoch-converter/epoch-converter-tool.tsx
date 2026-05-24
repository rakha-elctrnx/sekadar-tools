"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  Copy,
  Check,
  Play,
  Pause,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Plus,
  Minus,
  RefreshCw,
  Code,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToolDetailHeader } from "@/components/tool-detail-header";

type Unit = "s" | "ms" | "us" | "ns";
type CalcUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";
type SnippetLang = "js" | "py" | "go" | "java" | "cs" | "bash" | "sql" | "php";

export function EpochConverterTool() {
  // --- REAL-TIME TICKER ---
  const [tickerTime, setTickerTime] = useState<number>(0);
  const [isTickerRunning, setIsTickerRunning] = useState(true);
  const [copiedTicker, setCopiedTicker] = useState<"s" | "ms" | null>(null);
  
  // --- CONVERTER: TIMESTAMP -> DATE ---
  const [timestampInput, setTimestampInput] = useState("");
  const [activeUnit, setActiveUnit] = useState<Unit>("s");
  const [isAutoUnit, setIsAutoUnit] = useState(true);
  const [tsError, setTsError] = useState("");
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});

  // --- CONVERTER: DATE -> TIMESTAMP ---
  const [datePickerVal, setDatePickerVal] = useState("");
  const [customDateText, setCustomDateText] = useState("");
  const [dateError, setDateError] = useState("");
  const [dateResults, setDateResults] = useState<{
    s: string;
    ms: string;
    us: string;
    ns: string;
  } | null>(null);
  const [copiedDateFields, setCopiedDateFields] = useState<Record<string, boolean>>({});

  // --- CALCULATOR: OFFSET MATH ---
  const [calcBaseMode, setCalcBaseMode] = useState<"now" | "input" | "custom">("now");
  const [calcCustomDate, setCalcCustomDate] = useState("");
  const [calcOp, setCalcOp] = useState<"+" | "-">("+");
  const [calcVal, setCalcVal] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<CalcUnit>("days");
  const [calcResult, setCalcResult] = useState<{
    local: string;
    utc: string;
    s: string;
    ms: string;
  } | null>(null);
  const [copiedCalcFields, setCopiedCalcFields] = useState<Record<string, boolean>>({});

  // --- SNIPPETS LANGUAGE ---
  const [activeSnippetLang, setActiveSnippetLang] = useState<SnippetLang>("js");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Set initial ticker value
  useEffect(() => {
    setTickerTime(Date.now());
  }, []);

  // Update real-time clock ticker
  useEffect(() => {
    if (!isTickerRunning) return;
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 50);
    return () => clearInterval(interval);
  }, [isTickerRunning]);

  // Handle ticker actions
  const handleCopyTicker = async (unit: "s" | "ms") => {
    const val = unit === "s" ? Math.floor(tickerTime / 1000).toString() : tickerTime.toString();
    try {
      await navigator.clipboard.writeText(val);
      setCopiedTicker(unit);
      setTimeout(() => setCopiedTicker(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleUseTicker = (unit: "s" | "ms") => {
    const val = unit === "s" ? Math.floor(tickerTime / 1000).toString() : tickerTime.toString();
    setTimestampInput(val);
    setActiveUnit(unit);
    setIsAutoUnit(false);
  };

  // --- AUTOMATIC UNIT DETECTION ---
  const detectUnit = (valStr: string): Unit => {
    const clean = valStr.replace(/[^\d-]/g, "");
    const absVal = Math.abs(parseFloat(clean));
    if (isNaN(absVal)) return "s";
    
    // Thresholds
    // seconds: up to 10 digits (magnitude < 10^11) e.g., 2026 is 1782236400 (10 digits)
    // milliseconds: 11 to 13 digits (magnitude < 10^14)
    // microseconds: 14 to 16 digits (magnitude < 10^17)
    // nanoseconds: 17+ digits
    if (absVal < 10000000000) return "s";
    if (absVal < 10000000000000) return "ms";
    if (absVal < 10000000000000000) return "us";
    return "ns";
  };

  // Trigger conversion when input changes
  const handleTimestampChange = (val: string) => {
    setTimestampInput(val);
    if (!val.trim()) {
      setTsError("");
      return;
    }
    
    if (isAutoUnit) {
      const detected = detectUnit(val);
      setActiveUnit(detected);
    }
  };

  // Force unit manually
  const handleManualUnitChange = (unit: Unit) => {
    setActiveUnit(unit);
    setIsAutoUnit(false);
  };

  // Copy helper
  const handleCopyFieldValue = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFields((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedFields((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyDateField = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDateFields((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedDateFields((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCalcField = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCalcFields((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedCalcFields((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Date metadata calculations
  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getRelativeTime = (ms: number): string => {
    try {
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      const now = Date.now();
      const diff = ms - now;
      const absDiff = Math.abs(diff);

      const sec = 1000;
      const min = sec * 60;
      const hr = min * 60;
      const day = hr * 24;
      const week = day * 7;
      const month = day * 30;
      const year = day * 365;

      if (absDiff < sec * 5) return "just now";
      if (absDiff < min) return rtf.format(Math.round(diff / sec), "second");
      if (absDiff < hr) return rtf.format(Math.round(diff / min), "minute");
      if (absDiff < day) return rtf.format(Math.round(diff / hr), "hour");
      if (absDiff < week) return rtf.format(Math.round(diff / day), "day");
      if (absDiff < month) return rtf.format(Math.round(diff / week), "week");
      if (absDiff < year) return rtf.format(Math.round(diff / month), "month");
      return rtf.format(Math.round(diff / year), "year");
    } catch {
      return "";
    }
  };

  // Process timestamp conversions
  let localTime = "";
  let utcTime = "";
  let relativeTime = "";
  let isoString = "";
  let metadataStr = "";
  let leapYearStr = "";

  if (timestampInput.trim()) {
    try {
      const cleanInput = timestampInput.replace(/[^\d.-]/g, "");
      const num = parseFloat(cleanInput);
      if (isNaN(num)) {
        if (!tsError) setTsError("Invalid timestamp numerical format.");
      } else {
        if (tsError) setTsError("");
        
        let ms = num;
        if (activeUnit === "s") {
          ms = num * 1000;
        } else if (activeUnit === "us") {
          ms = num / 1000;
        } else if (activeUnit === "ns") {
          ms = num / 1000000;
        }

        const date = new Date(ms);
        if (isNaN(date.getTime())) {
          if (!tsError) setTsError("Invalid date range.");
        } else {
          localTime = date.toString();
          utcTime = date.toUTCString();
          relativeTime = getRelativeTime(ms);
          isoString = date.toISOString();
          
          const doy = getDayOfYear(date);
          const week = getWeekNumber(date);
          metadataStr = `Day ${doy} of ${isLeapYear(date.getFullYear()) ? 366 : 365}, Week ${week}`;
          leapYearStr = `${date.getFullYear()} is ${isLeapYear(date.getFullYear()) ? "" : "not "}a leap year`;
        }
      }
    } catch (e: any) {
      if (!tsError) setTsError(e.message || "Error formatting timestamp.");
    }
  }

  // --- HUMAN DATE TO TIMESTAMP ---
  const parseDateString = (text: string): Date | null => {
    const clean = text.trim().toLowerCase();
    if (!clean) return null;
    
    const now = new Date();
    if (clean === "now") return now;
    if (clean === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (clean === "yesterday") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (clean === "tomorrow") return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (clean === "start of year" || clean === "start of the year") return new Date(now.getFullYear(), 0, 1);
    if (clean === "end of year" || clean === "end of the year") return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    // Parse raw text
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  };

  const handleDateToTimestampConvert = useCallback(() => {
    setDateError("");
    let dateObj: Date | null = null;

    if (customDateText.trim()) {
      dateObj = parseDateString(customDateText);
      if (!dateObj) {
        setDateError("Failed to parse custom date text. Try a standard format or 'now', 'today', 'yesterday'.");
        setDateResults(null);
        return;
      }
    } else if (datePickerVal) {
      dateObj = new Date(datePickerVal);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const msVal = dateObj.getTime();
      setDateResults({
        s: Math.floor(msVal / 1000).toString(),
        ms: msVal.toString(),
        us: (msVal * 1000).toString(),
        ns: (msVal * 1000000).toString(),
      });
    } else {
      setDateResults(null);
      if (!customDateText.trim() && !datePickerVal) {
        setDateError("Please select a date or enter custom date text.");
      }
    }
  }, [customDateText, datePickerVal]);

  // Keep date-to-timestamp synchronized when typing custom or picker
  useEffect(() => {
    if (datePickerVal || customDateText) {
      handleDateToTimestampConvert();
    } else {
      setDateResults(null);
      setDateError("");
    }
  }, [datePickerVal, customDateText, handleDateToTimestampConvert]);

  const loadPresetDateText = (preset: string) => {
    setDatePickerVal("");
    setCustomDateText(preset);
  };

  // --- OFFSET MATH CALCULATOR ---
  const runCalculator = useCallback(() => {
    let baseDate: Date;
    if (calcBaseMode === "now") {
      baseDate = new Date();
    } else if (calcBaseMode === "input" && timestampInput.trim() && !tsError) {
      let ms = parseFloat(timestampInput);
      if (activeUnit === "s") ms *= 1000;
      else if (activeUnit === "us") ms /= 1000;
      else if (activeUnit === "ns") ms /= 1000000;
      baseDate = new Date(ms);
    } else if (calcBaseMode === "custom" && calcCustomDate) {
      baseDate = new Date(calcCustomDate);
    } else {
      baseDate = new Date();
    }

    if (isNaN(baseDate.getTime())) {
      setCalcResult(null);
      return;
    }

    const d = new Date(baseDate.getTime());
    const mult = calcOp === "+" ? 1 : -1;
    const offset = calcVal * mult;

    switch (calcUnit) {
      case "seconds":
        d.setSeconds(d.getSeconds() + offset);
        break;
      case "minutes":
        d.setMinutes(d.getMinutes() + offset);
        break;
      case "hours":
        d.setHours(d.getHours() + offset);
        break;
      case "days":
        d.setDate(d.getDate() + offset);
        break;
      case "weeks":
        d.setDate(d.getDate() + offset * 7);
        break;
      case "months":
        d.setMonth(d.getMonth() + offset);
        break;
      case "years":
        d.setFullYear(d.getFullYear() + offset);
        break;
    }

    setCalcResult({
      local: d.toString(),
      utc: d.toUTCString(),
      s: Math.floor(d.getTime() / 1000).toString(),
      ms: d.getTime().toString(),
    });
  }, [calcBaseMode, calcCustomDate, calcOp, calcVal, calcUnit, timestampInput, activeUnit, tsError]);

  useEffect(() => {
    runCalculator();
  }, [runCalculator]);

  // --- CODE SNIPPETS CHEATSHEETS ---
  const snippets: Record<SnippetLang, { title: string; code: string }> = {
    js: {
      title: "JavaScript / TypeScript",
      code: `// Get current epoch timestamp in SECONDS
const seconds = Math.floor(Date.now() / 1000);

// Get current epoch timestamp in MILLISECONDS
const milliseconds = Date.now();

// Convert timestamp (seconds) to Date object
const date = new Date(seconds * 1000);
console.log(date.toISOString());`
    },
    py: {
      title: "Python",
      code: `import time
from datetime import datetime

# Get current epoch timestamp in SECONDS
seconds = int(time.time())

# Get current epoch timestamp in MILLISECONDS
milliseconds = int(time.time() * 1000)

# Convert timestamp (seconds) to datetime
dt = datetime.fromtimestamp(seconds)
print(dt.strftime('%Y-%m-%d %H:%M:%S'))`
    },
    go: {
      title: "Go",
      code: `package main

import (
\t"fmt"
\t"time"
)

func main() {
\t// Get current epoch timestamp in SECONDS
\tseconds := time.Now().Unix()

\t// Get current epoch timestamp in MILLISECONDS
\tmilliseconds := time.Now().UnixMilli()

\t// Convert timestamp to Time object
\tt := time.Unix(seconds, 0)
\tfmt.Println(t.Format(time.RFC3339))
}`
    },
    java: {
      title: "Java",
      code: `// Get current epoch timestamp in SECONDS
long seconds = System.currentTimeMillis() / 1000L;

// Get current epoch timestamp in MILLISECONDS
long milliseconds = System.currentTimeMillis();

// Convert timestamp (seconds) to Instant
java.time.Instant instant = java.time.Instant.ofEpochSecond(seconds);
System.out.println(instant.toString());`
    },
    cs: {
      title: "C# / .NET",
      code: `using System;

// Get current epoch timestamp in SECONDS
long seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

// Get current epoch timestamp in MILLISECONDS
long milliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

// Convert timestamp (seconds) to DateTimeOffset
DateTimeOffset dt = DateTimeOffset.FromUnixTimeSeconds(seconds);
Console.WriteLine(dt.ToString("o"));`
    },
    bash: {
      title: "Bash / Shell",
      code: `# Get current epoch timestamp in SECONDS
date +%s

# Get current epoch timestamp in MILLISECONDS
date +%s%3N

# Convert timestamp (seconds) to human date (macOS)
date -r 1782236400

# Convert timestamp (seconds) to human date (Linux)
date -d @1782236400`
    },
    sql: {
      title: "SQL",
      code: `-- PostgreSQL
SELECT extract(epoch from now()); -- Seconds
SELECT extract(epoch from now()) * 1000; -- Milliseconds

-- MySQL
SELECT UNIX_TIMESTAMP(); -- Seconds

-- SQL Server (T-SQL)
SELECT DATEDIFF(s, '1970-01-01 00:00:00', GETUTCDATE());`
    },
    php: {
      title: "PHP",
      code: `<?php
// Get current epoch timestamp in SECONDS
$seconds = time();

// Get current epoch timestamp in MILLISECONDS
$milliseconds = round(microtime(true) * 1000);

// Convert timestamp to formatted date
$dateStr = date('Y-m-d H:i:s', $seconds);
echo $dateStr;`
    }
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippets[activeSnippetLang].code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSampleTimestamp = () => {
    // A nice future sample timestamp in May 2026
    setTimestampInput("1782236400");
    setActiveUnit("s");
    setIsAutoUnit(false);
    setTsError("");
  };

  const handleClearTimestampInput = () => {
    setTimestampInput("");
    setTsError("");
  };

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Epoch / Unix Timestamp Converter"
        description="Parse, convert, and calculate Unix timestamps across s, ms, us, and ns"
        icon={Clock}
      />

      {/* Real-time Ticker Widget */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-5">
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#c5030c] uppercase tracking-widest dark:text-[#c5030c]">
              <span className="relative flex size-2">
                {isTickerRunning && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c5030c] opacity-75" />
                )}
                <span className="relative inline-flex size-2 rounded-full bg-[#c5030c]" />
              </span>
              Current Unix Timestamp
            </span>
            
            <div className="flex flex-col gap-0.5 pt-1 sm:flex-row sm:items-baseline sm:gap-3">
              <div className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                {tickerTime ? Math.floor(tickerTime / 1000).toLocaleString("en-US", { useGrouping: false }) : "0"}
              </div>
              <span className="text-sm font-medium text-muted-foreground font-mono tabular-nums">
                seconds
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 font-mono text-sm text-muted-foreground/80 tabular-nums">
              <span>{tickerTime ? tickerTime.toLocaleString("en-US", { useGrouping: false }) : "0"}</span>
              <span className="text-[11px] font-sans text-muted-foreground/60">milliseconds</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTickerRunning(!isTickerRunning)}
              className="h-8.5 gap-1.5 border-border/80 bg-background/50 hover:bg-background"
            >
              {isTickerRunning ? (
                <>
                  <Pause className="size-3.5" />
                  Freeze
                </>
              ) : (
                <>
                  <Play className="size-3.5 text-emerald-500" />
                  Resume
                </>
              )}
            </Button>

            <div className="flex items-center rounded-lg border border-border bg-background/50 p-0.5">
              <div className="flex items-center gap-0.5 border-r border-border/80 pr-1 mr-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleCopyTicker("s")}
                  title="Copy seconds"
                  className="h-7 text-xs font-semibold px-2"
                >
                  {copiedTicker === "s" ? (
                    <Check className="size-3 text-emerald-500 mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  Seconds
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleUseTicker("s")}
                  title="Use seconds in converter"
                  className="h-7 text-xs text-[#c5030c]"
                >
                  Insert s
                </Button>
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleCopyTicker("ms")}
                  title="Copy milliseconds"
                  className="h-7 text-xs font-semibold px-2"
                >
                  {copiedTicker === "ms" ? (
                    <Check className="size-3 text-emerald-500 mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  MS
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleUseTicker("ms")}
                  title="Use milliseconds in converter"
                  className="h-7 text-xs text-[#c5030c]"
                >
                  Insert ms
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <Tabs defaultValue="ts-to-date" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value="ts-to-date" className="text-xs sm:text-sm">
            Timestamp ➔ Date
          </TabsTrigger>
          <TabsTrigger value="date-to-ts" className="text-xs sm:text-sm">
            Date ➔ Timestamp
          </TabsTrigger>
          <TabsTrigger value="calc" className="text-xs sm:text-sm">
            Time Calculator
          </TabsTrigger>
        </TabsList>

        {/* ============================================== */}
        {/* TABS: TIMESTAMP TO DATE                        */}
        {/* ============================================== */}
        <TabsContent value="ts-to-date" className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              
              {/* Input section */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="timestamp-input" className="text-sm font-semibold">
                    Enter Timestamp
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={loadSampleTimestamp}
                      className="text-xs text-[#c5030c] hover:text-[#c5030c] gap-1 h-6 px-1.5"
                    >
                      <Sparkles className="size-3" />
                      Load sample
                    </Button>
                    {timestampInput && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleClearTimestampInput}
                        className="text-muted-foreground size-6"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Input
                    id="timestamp-input"
                    value={timestampInput}
                    onChange={(e) => handleTimestampChange(e.target.value)}
                    placeholder="e.g. 1782236400 or 1782236400000..."
                    className="h-10 font-mono text-base pr-20"
                  />
                  <div className="absolute right-2.5 top-1.5 flex items-center gap-1">
                    {timestampInput.trim() && isAutoUnit && (
                      <Badge variant="secondary" className="bg-[#c5030c]/10 text-[#c5030c] dark:text-[#c5030c] border-none text-[10px] h-6 px-2">
                        Auto: {activeUnit === "s" ? "s" : activeUnit === "ms" ? "ms" : activeUnit === "us" ? "μs" : "ns"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Unit Manual Selection Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Time Unit</Label>
                <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 h-10 items-center">
                  {(["s", "ms", "us", "ns"] as Unit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleManualUnitChange(unit)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold font-mono transition-all ${
                        activeUnit === unit && !isAutoUnit
                          ? "bg-background text-foreground shadow-sm"
                          : activeUnit === unit && isAutoUnit
                          ? "bg-[#c5030c]/10 text-[#c5030c] dark:text-[#c5030c] font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {unit === "s" ? "s" : unit === "ms" ? "ms" : unit === "us" ? "μs" : "ns"}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setIsAutoUnit(true);
                      const detected = detectUnit(timestampInput);
                      setActiveUnit(detected);
                    }}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ml-1 ${
                      isAutoUnit
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Auto-detect
                  </button>
                </div>
              </div>

            </div>

            {/* Error display */}
            {tsError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-destructive">{tsError}</span>
              </div>
            )}

            {/* Conversions Output Grid */}
            {timestampInput.trim() && !tsError && (
              <div className="pt-2 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 text-[#c5030c]" />
                  Calculated Date &amp; Time
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  
                  {/* Local Time Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Local Time Zone</span>
                      <div className="font-mono text-[13px] font-semibold text-foreground leading-normal break-words pr-8">
                        {localTime}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("local", localTime)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy local time"
                    >
                      {copiedFields["local"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                  {/* UTC / GMT Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GMT / UTC Time</span>
                      <div className="font-mono text-[13px] font-semibold text-foreground leading-normal break-words pr-8">
                        {utcTime}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("utc", utcTime)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy GMT time"
                    >
                      {copiedFields["utc"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                  {/* Relative Time Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Relative Time</span>
                      <div className="font-mono text-[13px] font-semibold text-[#c5030c] dark:text-[#c5030c] leading-normal pr-8">
                        {relativeTime}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("relative", relativeTime)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy relative time"
                    >
                      {copiedFields["relative"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                  {/* ISO 8601 Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ISO 8601 String</span>
                      <div className="font-mono text-[13px] font-semibold text-foreground leading-normal break-all pr-8">
                        {isoString}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("iso", isoString)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy ISO string"
                    >
                      {copiedFields["iso"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                  {/* Day/Week Stats Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Day &amp; Week Information</span>
                      <div className="font-mono text-[13px] font-semibold text-foreground leading-normal pr-8">
                        {metadataStr}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("meta", metadataStr)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy details"
                    >
                      {copiedFields["meta"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                  {/* Leap Year Card */}
                  <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Leap Year Status</span>
                      <div className="font-mono text-[13px] font-semibold text-foreground leading-normal pr-8">
                        {leapYearStr}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyFieldValue("leap", leapYearStr)}
                      className="absolute right-2 top-2 hover:bg-background/80"
                      title="Copy leap status"
                    >
                      {copiedFields["leap"] ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>

                </div>
              </div>
            )}

            {!timestampInput.trim() && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
                <Clock className="size-8 mb-2.5 stroke-1 text-muted-foreground/40" />
                <p className="text-sm">Enter a Unix timestamp to view converted date formats.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============================================== */}
        {/* TABS: DATE TO TIMESTAMP                        */}
        {/* ============================================== */}
        <TabsContent value="date-to-ts" className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            
            <div className="grid gap-5 md:grid-cols-2">
              
              {/* Left Column: Input Panel */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="datetime-picker" className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="size-4 text-[#c5030c]" />
                    Option 1: Date &amp; Time Picker
                  </Label>
                  <Input
                    id="datetime-picker"
                    type="datetime-local"
                    value={datePickerVal}
                    onChange={(e) => {
                      setDatePickerVal(e.target.value);
                      setCustomDateText("");
                    }}
                    className="h-10 font-mono text-sm"
                  />
                </div>

                <div className="relative py-2 flex items-center justify-center">
                  <span className="absolute h-px w-full bg-border" />
                  <span className="relative bg-card px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">OR</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-date-text" className="text-sm font-semibold">
                    Option 2: Relative Text / Custom Date String
                  </Label>
                  <Input
                    id="custom-date-text"
                    type="text"
                    value={customDateText}
                    onChange={(e) => {
                      setCustomDateText(e.target.value);
                      setDatePickerVal("");
                    }}
                    placeholder="e.g. now, yesterday, tomorrow, 2026-05-23, or RFC 2822..."
                    className="h-10 font-mono text-sm"
                  />

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {["now", "today", "yesterday", "tomorrow", "start of year"].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="xs"
                        onClick={() => loadPresetDateText(preset)}
                        className={`text-[11px] h-6 ${customDateText === preset ? "border-[#c5030c]/30 bg-[#c5030c]/5 text-[#c5030c] dark:text-[#c5030c]" : ""}`}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                {dateError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-destructive">{dateError}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Output Results */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 text-[#c5030c]" />
                  Generated Timestamps
                </h3>

                {dateResults ? (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/15 p-4.5">
                    
                    {/* Seconds Result */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Seconds (s)</span>
                        <div className="font-mono text-base font-extrabold tracking-tight tabular-nums text-foreground">
                          {dateResults.s}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleCopyDateField("s", dateResults.s)}
                        className="h-7 text-xs font-semibold self-start sm:self-auto"
                      >
                        {copiedDateFields["s"] ? (
                          <Check className="size-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="size-3 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* Milliseconds Result */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Milliseconds (ms)</span>
                        <div className="font-mono text-base font-extrabold tracking-tight tabular-nums text-foreground">
                          {dateResults.ms}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleCopyDateField("ms", dateResults.ms)}
                        className="h-7 text-xs font-semibold self-start sm:self-auto"
                      >
                        {copiedDateFields["ms"] ? (
                          <Check className="size-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="size-3 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* Microseconds Result */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Microseconds (μs)</span>
                        <div className="font-mono text-base font-bold tracking-tight tabular-nums text-foreground">
                          {dateResults.us}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleCopyDateField("us", dateResults.us)}
                        className="h-7 text-xs font-semibold self-start sm:self-auto"
                      >
                        {copiedDateFields["us"] ? (
                          <Check className="size-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="size-3 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>

                    <div className="h-px bg-border/60" />

                    {/* Nanoseconds Result */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nanoseconds (ns)</span>
                        <div className="font-mono text-base font-bold tracking-tight tabular-nums text-foreground">
                          {dateResults.ns}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleCopyDateField("ns", dateResults.ns)}
                        className="h-7 text-xs font-semibold self-start sm:self-auto"
                      >
                        {copiedDateFields["ns"] ? (
                          <Check className="size-3 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="size-3 mr-1" />
                        )}
                        Copy
                      </Button>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl h-[280px]">
                    <Calendar className="size-7 mb-2 stroke-1 text-muted-foreground/40" />
                    <p className="text-xs px-6 leading-relaxed">Choose a date value on the left to see Unix timestamps populated dynamically.</p>
                  </div>
                )}

              </div>

            </div>

          </div>
        </TabsContent>

        {/* ============================================== */}
        {/* TABS: TIME CALCULATOR                          */}
        {/* ============================================== */}
        <TabsContent value="calc" className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            
            <div className="grid gap-5 md:grid-cols-2">
              {/* Left Column: Calculation settings */}
              <div className="space-y-4">
                
                {/* Base Date Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Base Date Selection</Label>
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/30 p-0.5 h-10 items-center">
                    <button
                      onClick={() => setCalcBaseMode("now")}
                      className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                        calcBaseMode === "now" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Current Time
                    </button>
                    <button
                      onClick={() => setCalcBaseMode("input")}
                      disabled={!timestampInput.trim() || !!tsError}
                      className={`rounded-md py-1.5 text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none ${
                        calcBaseMode === "input" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Converter Input
                    </button>
                    <button
                      onClick={() => setCalcBaseMode("custom")}
                      className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                        calcBaseMode === "custom" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Custom Date
                    </button>
                  </div>
                </div>

                {/* Custom Base Date Picker */}
                {calcBaseMode === "custom" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Label htmlFor="calc-custom-date" className="text-sm font-semibold">Custom Base Date</Label>
                    <Input
                      id="calc-custom-date"
                      type="datetime-local"
                      value={calcCustomDate}
                      onChange={(e) => setCalcCustomDate(e.target.value)}
                      className="h-10 font-mono text-sm"
                    />
                  </div>
                )}

                {/* Arithmetic Parameters */}
                <div className="grid grid-cols-12 gap-3">
                  
                  {/* Sign Toggle */}
                  <div className="col-span-3 space-y-2">
                    <Label className="text-sm font-semibold">Math</Label>
                    <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 h-10 items-center">
                      <button
                        onClick={() => setCalcOp("+")}
                        className={`flex-1 flex justify-center items-center rounded-md py-1.5 text-xs font-bold transition-all ${
                          calcOp === "+" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Add time"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setCalcOp("-")}
                        className={`flex-1 flex justify-center items-center rounded-md py-1.5 text-xs font-bold transition-all ${
                          calcOp === "-" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Subtract time"
                      >
                        <Minus className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity Amount */}
                  <div className="col-span-4 space-y-2">
                    <Label htmlFor="calc-amount" className="text-sm font-semibold">Amount</Label>
                    <Input
                      id="calc-amount"
                      type="number"
                      min="0"
                      value={calcVal}
                      onChange={(e) => setCalcVal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-10 text-center font-mono font-bold"
                    />
                  </div>

                  {/* Offset Units selector */}
                  <div className="col-span-5 space-y-2">
                    <Label htmlFor="calc-unit" className="text-sm font-semibold">Unit</Label>
                    <select
                      id="calc-unit"
                      value={calcUnit}
                      onChange={(e) => setCalcUnit(e.target.value as CalcUnit)}
                      className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Right Column: Calculations Outputs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 text-[#c5030c]" />
                  Calculation Results
                </h3>

                {calcResult ? (
                  <div className="space-y-3.5 rounded-xl border border-border bg-muted/15 p-4.5">
                    
                    {/* New Local Time */}
                    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/50 p-3 pr-10">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Calculated Local Date</span>
                      <span className="font-mono text-[13px] font-semibold text-foreground leading-normal break-words">{calcResult.local}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopyCalcField("local", calcResult.local)}
                        className="absolute right-2 top-2 hover:bg-background"
                        title="Copy date"
                      >
                        {copiedCalcFields["local"] ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>

                    {/* New UTC Time */}
                    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/50 p-3 pr-10">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Calculated UTC Date</span>
                      <span className="font-mono text-[13px] font-semibold text-foreground leading-normal break-words">{calcResult.utc}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopyCalcField("utc", calcResult.utc)}
                        className="absolute right-2 top-2 hover:bg-background"
                        title="Copy date"
                      >
                        {copiedCalcFields["utc"] ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>

                    {/* New Timestamp Result */}
                    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-background/50 p-3 pr-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">New Unix Epoch (s)</span>
                      </div>
                      <span className="font-mono text-base font-extrabold tracking-tight tabular-nums text-[#c5030c] dark:text-[#c5030c] block pt-0.5">{calcResult.s}</span>
                      
                      <div className="absolute right-2 top-2.5 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopyCalcField("ts", calcResult.s)}
                          className="hover:bg-background"
                          title="Copy timestamp"
                        >
                          {copiedCalcFields["ts"] ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setTimestampInput(calcResult.s);
                            setActiveUnit("s");
                            setIsAutoUnit(false);
                            setTsError("");
                          }}
                          className="h-6 text-[10px] text-[#c5030c]"
                          title="Send this resulting timestamp into the main converter"
                        >
                          Use in Converter
                        </Button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl h-[260px]">
                    <RefreshCw className="size-7 mb-2 stroke-1 text-muted-foreground/40 animate-spin" />
                    <p className="text-xs">Processing calculation offset...</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </TabsContent>

      </Tabs>

      {/* Cheatsheets programming section */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Code className="size-4.5 text-[#c5030c]" />
          Retrieve Epoch in Programming Languages
        </h2>

        <div className="flex flex-col gap-4.5 md:flex-row">
          {/* List panel */}
          <div className="flex flex-wrap md:flex-col gap-1 w-full md:w-[180px] shrink-0">
            {(Object.keys(snippets) as SnippetLang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setActiveSnippetLang(lang);
                  setCopiedSnippet(false);
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all text-left ${
                  activeSnippetLang === lang
                    ? "bg-[#c5030c]/10 text-[#c5030c] dark:text-[#c5030c] font-bold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span>{snippets[lang].title}</span>
              </button>
            ))}
          </div>

          {/* Code viewport */}
          <div className="flex-1 min-w-0">
            <div className="relative rounded-xl border border-border/80 bg-muted/30 p-4 font-mono text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap break-normal overflow-x-auto">
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopySnippet}
                className="absolute right-3 top-3 h-7 bg-background/50 hover:bg-background"
                title="Copy snippet"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="size-3 text-emerald-500 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <code>{snippets[activeSnippetLang].code}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Info Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3.5 text-sm font-bold flex items-center gap-2">
          <BookOpen className="size-4.5 text-[#c5030c]" />
          About Unix Epoch Time
        </h2>
        <div className="grid gap-5 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <div className="space-y-2.5">
            <p>
              <strong className="text-foreground">What is Epoch Time?</strong>{" "}
              The Unix epoch (or Unix time / POSIX time) is a system for describing a point in time. It is defined as the number of **seconds** that have elapsed since the **Unix epoch** (00:00:00 UTC on January 1, 1970), minus leap seconds.
            </p>
            <div>
              <strong className="text-foreground">Time Scale Resolution:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li><code className="font-semibold text-foreground">1 s</code> = 10 digits (Standard Unix timestamp)</li>
                <li><code className="font-semibold text-foreground">1 ms</code> = 13 digits (Javascript, Java milliseconds)</li>
                <li><code className="font-semibold text-foreground">1 μs</code> = 16 digits (High-res timestamp)</li>
                <li><code className="font-semibold text-foreground">1 ns</code> = 19 digits (System clock/Go/Rust precision)</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2.5">
            <p>
              <strong className="text-foreground">The Year 2038 Problem (Y2K38):</strong> On January 19, 2038, 32-bit signed integer representations of Unix time will overflow (`2,147,483,647` seconds), resetting the clock to 1901. Modern systems utilize 64-bit integers instead, extending the maximum epoch limit by billions of years.
            </p>
            <p>
              <strong className="text-foreground">Safety &amp; Privacy:</strong> All calculations, text date parsing, and offset arithmetic are executed client-side on your device inside your web browser. No data leaves your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
