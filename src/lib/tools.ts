import {
  Braces,
  Clock,
  FileCode2,
  FileSpreadsheet,
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
    category: "Text & Data",
    tags: ["Encoding", "Text", "Data"],
    isNew: false,
  },
  {
    title: "JSON Formatter",
    description:
      "Beautify, minify, and validate JSON data with syntax highlighting.",
    href: "/tools/json-formatter",
    icon: Braces,
    category: "Text & Data",
    tags: ["JSON", "Format", "Validate"],
    isNew: false,
  },
  {
    title: "Markdown Previewer",
    description:
      "Write Markdown and preview the rendered output in real-time. Copy and download instantly.",
    href: "/tools/markdown-previewer",
    icon: FileText,
    category: "Text & Data",
    tags: ["Markdown", "Preview", "Docs"],
    isNew: false,
  },
  {
    title: "Password Generator",
    description: "Generate secure random passwords with customizable options.",
    href: "/tools/password-generator",
    icon: Key,
    category: "Developer",
    tags: ["Password", "Security", "Generator"],
    isNew: false,
  },
  {
    title: "Epoch Converter",
    description:
      "Convert Unix timestamps to human-readable dates and vice versa. Supports seconds, milliseconds, microseconds, and nanoseconds in real-time.",
    href: "/tools/epoch-converter",
    icon: Clock,
    category: "Developer",
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
    title: "CSV ↔ JSON Converter",
    description:
      "Convert CSV data to JSON arrays and JSON arrays back to CSV. Supports custom delimiters.",
    href: "/tools/csv-json-converter",
    icon: FileSpreadsheet,
    category: "Text & Data",
    tags: ["CSV", "JSON", "Convert", "Data"],
    isNew: true,
  },
  {
    title: "Color Picker",
    description:
      "Pick colors, generate shades & tints, explore harmonies, build gradients, check contrast, and simulate color blindness.",
    href: "/tools/color-picker",
    icon: Palette,
    category: "Design",
    tags: ["Color", "Design", "Picker", "Gradient", "Contrast"],
    isNew: false,
  },
];