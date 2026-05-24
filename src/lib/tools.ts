import {
  Braces,
  Clock,
  FileCode2,
  FileText,
  Palette,
  TextSearch,
  Key,
} from "lucide-react";

export interface ToolDefinition {
  title: string;
  description: string;
  href: string;
  icon: typeof FileCode2;
  category: string;
  tags: string[];
  isNew?: boolean;
}

export const tools: ToolDefinition[] = [
  {
    title: "Base64 Encode / Decode",
    description:
      "Encode text to Base64 or decode Base64 strings back to plain text. Supports UTF-8.",
    href: "/tools/base64",
    icon: FileCode2,
    category: "Text",
    tags: ["Encoding", "Text", "Data"],
    isNew: true,
  },
  {
    title: "Password Generator",
    description: "Generate secure random passwords with customizable options.",
    href: "/tools/password-generator",
    icon: Key,
    category: "Security",
    tags: ["Password", "Security", "Generator"],
    isNew: true,
  },
  {
    title: "JSON Formatter",
    description:
      "Beautify, minify, and validate JSON data with syntax highlighting.",
    href: "/tools/json-formatter",
    icon: Braces,
    category: "Data",
    tags: ["JSON", "Format", "Validate"],
    isNew: true,
  },
  {
    title: "Epoch Converter",
    description:
      "Convert Unix timestamps to human-readable dates and vice versa. Supports seconds, milliseconds, microseconds, and nanoseconds in real-time.",
    href: "/tools/epoch-converter",
    icon: Clock,
    category: "Date & Time",
    tags: ["Date", "Time", "Epoch", "Unix"],
    isNew: false,
  },
  {
    title: "Regex Tester",
    description:
      "Test, debug, and learn Regular Expressions with real-time highlighting and a built-in cheatsheet.",
    href: "/tools/regex-tester",
    icon: TextSearch,
    category: "Developer",
    tags: ["Regex", "Developer", "Test"],
    isNew: false,
  },
  {
    title: "Markdown Previewer",
    description:
      "Write Markdown and preview the rendered output in real-time. Copy and download instantly.",
    href: "/tools/markdown-previewer",
    icon: FileText,
    category: "Text",
    tags: ["Markdown", "Preview", "Docs"],
    isNew: true,
  },
  {
    title: "Color Converter",
    description:
      "Convert colors between HEX, RGB, HSL, and OKLCH formats instantly.",
    href: "/tools/color-converter",
    icon: Palette,
    category: "Design",
    tags: ["Color", "Design", "Convert"],
    isNew: false,
  },
];