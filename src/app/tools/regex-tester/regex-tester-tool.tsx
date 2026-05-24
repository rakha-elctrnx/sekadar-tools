"use client";

import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  BookOpen,
  TextSearch,
} from "lucide-react";
import { ToolDetailHeader } from "@/components/tool-detail-header";

const REGEX_EXAMPLES = [
  {
    name: "Email Address",
    pattern: "\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b",
    flags: "g",
    testString: "Contact us at support@example.com or sales@test-domain.co.uk.\nInvalid: user@domain, @missing.com, user@.com",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    flags: "g",
    testString: "Check out https://github.com and http://www.example.org/path?q=123\nInvalid: ftp://server, http//broken",
  },
  {
    name: "Phone Number (E.164)",
    pattern: "^\\+?[1-9]\\d{1,14}$",
    flags: "gm",
    testString: "+1234567890\n+447123456789\n12345\n001234567 (invalid E.164)\n+1 234 567 890 (invalid, spaces not allowed)",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    flags: "gm",
    testString: "2023-12-31\n2024-02-29\n2023-13-01 (invalid month)\n2023-04-31 (invalid day)",
  },
  {
    name: "Hex Color",
    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    flags: "gm",
    testString: "#FFFFFF\n#000\n#1A2b3C\n#FF (invalid)\n#12345G (invalid letter)\n123456 (missing #)",
  }
];

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  const regexResult = useMemo(() => {
    if (!pattern) return { regex: null, error: null, matches: [] };

    try {
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;

      // We need to clone the regex to avoid mutating lastIndex for the caller
      const searchRegex = new RegExp(pattern, flags);

      if (searchRegex.global) {
        let count = 0;
        // prevent infinite loop for zero-width matches
        while ((match = searchRegex.exec(testString)) !== null && count < 5000) {
          if (match.index === searchRegex.lastIndex) {
            searchRegex.lastIndex++;
          }
          matches.push({
            index: match.index,
            0: match[0],
            groups: match.slice(1)
          });
          count++;
        }
      } else {
        match = searchRegex.exec(testString);
        if (match) {
          matches.push({
            index: match.index,
            0: match[0],
            groups: match.slice(1)
          });
        }
      }

      return { regex, error: null, matches };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { regex: null, error: errorMessage, matches: [] };
    }
  }, [pattern, flags, testString]);

  const handleCopy = () => {
    const fullRegex = `/${pattern}/${flags}`;
    navigator.clipboard.writeText(fullRegex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (example: typeof REGEX_EXAMPLES[0]) => {
    setPattern(example.pattern);
    setFlags(example.flags);
    setTestString(example.testString);
  };

  const renderHighlightedText = () => {
    if (!testString) return null;
    if (regexResult.error || !regexResult.regex || regexResult.matches.length === 0) {
      return <>{testString}</>;
    }

    const elements = [];
    let lastIndex = 0;

    for (let i = 0; i < regexResult.matches.length; i++) {
      const match = regexResult.matches[i];
      const matchLength = match[0].length;

      // Skip empty matches that don't advance the index to prevent rendering issues
      if (matchLength === 0) continue;

      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap">
            {testString.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the matched text
      elements.push(
        <span
          key={`match-${i}`}
          className={`whitespace-pre-wrap rounded px-0.5 ${i % 2 === 0
              ? "bg-[#c5030c]/30 text-[#c5030c] dark:text-[#c5030c]"
              : "bg-[#c5030c]/30 text-[#c5030c] dark:text-[#c5030c]"
            }`}
        >
          {testString.substring(match.index, match.index + matchLength)}
        </span>
      );

      lastIndex = match.index + matchLength;
    }

    // Add remaining text after the last match
    if (lastIndex < testString.length) {
      elements.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {testString.substring(lastIndex)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Regex Tester"
        description="Test and debug your regular expressions with real-time highlighting."
        icon={TextSearch}
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <div className="space-y-2">
            <Label>Regular Expression</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3 text-muted-foreground font-mono font-bold">/</span>
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern (e.g. \b\w+\b)"
                  className="font-mono pl-7 pr-3"
                />
                <span className="absolute right-3 text-muted-foreground font-mono font-bold">/</span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar shrink-0 items-center">
                {[
                  { id: "g", label: "Global", desc: "Don't return after first match" },
                  { id: "i", label: "Case Insensitive", desc: "Case insensitive match" },
                  { id: "m", label: "Multiline", desc: "^ and $ match start/end of line" },
                ].map((flag) => (
                  <Button
                    key={flag.id}
                    variant={flags.includes(flag.id) ? "default" : "outline"}
                    size="sm"
                    className="font-mono h-10 w-10 shrink-0 p-0"
                    onClick={() => toggleFlag(flag.id)}
                    title={flag.desc}
                  >
                    {flag.id}
                  </Button>
                ))}
              </div>
            </div>

            {regexResult.error ? (
              <div className="flex items-center gap-2 text-sm text-destructive mt-2 bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{regexResult.error}</span>
              </div>
            ) : pattern ? (
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-md px-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Valid expression</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-3 w-3" />
                  {copied ? "Copied!" : "Copy Regex"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Test String</Label>
              <div className="text-xs text-muted-foreground">
                {regexResult.matches.length} match{regexResult.matches.length === 1 ? "" : "es"}
              </div>
            </div>
            <div className="relative">
              <div
                ref={highlightRef}
                className="absolute inset-0 px-2.5 py-2 bg-background border border-transparent pointer-events-none overflow-hidden rounded-lg break-words whitespace-pre-wrap font-mono text-base md:text-sm"
                aria-hidden="true"
              >
                {renderHighlightedText()}
              </div>
              <Textarea
                ref={textareaRef}
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                onScroll={handleScroll}
                placeholder="Enter string to test your regex against..."
                className="min-h-[200px] font-mono resize-y z-10 relative bg-transparent text-transparent caret-foreground text-base md:text-sm"
                spellCheck={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Matches are highlighted in alternating colors.
            </p>
          </div>
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#c5030c]" />
              Examples
            </h3>
            <div className="flex flex-wrap gap-2">
              {REGEX_EXAMPLES.map((example) => (
                <Button
                  key={example.name}
                  variant="outline"
                  size="sm"
                  onClick={() => loadExample(example)}
                  className="text-xs h-8"
                >
                  {example.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#c5030c]" />
              Cheatsheet
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground/80 mb-1">Character Classes</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">.</code> <span>Any character except newline</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">\w</code> <span>Word character (a-zA-Z0-9_)</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">\d</code> <span>Digit (0-9)</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">\s</code> <span>Whitespace (space, tab, etc)</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground/80 mb-1">Anchors</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">^</code> <span>Start of string / line</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">$</code> <span>End of string / line</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">\b</code> <span>Word boundary</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground/80 mb-1">Quantifiers</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">*</code> <span>0 or more</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">+</code> <span>1 or more</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">?</code> <span>0 or 1</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">{`{3}`}</code> <span>Exactly 3</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">{`{3,}`}</code> <span>3 or more</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-foreground/80 mb-1">Groups & Ranges</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">(a|b)</code> <span>Capture group (a OR b)</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">(?:a)</code> <span>Non-capturing group</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">[abc]</code> <span>Range (a or b or c)</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">[^abc]</code> <span>Not a, b, or c</span></li>
                  <li className="flex justify-between"><code className="text-xs bg-muted px-1 py-0.5 rounded">[a-z]</code> <span>Range between a to z</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
