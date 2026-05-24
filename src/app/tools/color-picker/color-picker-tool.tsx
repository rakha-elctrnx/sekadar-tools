"use client";

import { useState, useCallback, useMemo } from "react";
import Color from "colorjs.io";
import { Copy, Check, Palette, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolDetailHeader } from "@/components/tool-detail-header";

type TabId = "converter" | "shades" | "harmonies" | "gradient" | "contrast" | "blindness";

// --- Utility helpers ---
function hexFromColor(color: Color): string {
  try {
    return color.to("srgb").toString({ format: "hex" });
  } catch {
    return "#000000";
  }
}

function generateShades(baseHex: string, count: number = 10): string[] {
  try {
    const base = new Color(baseHex);
    const hsl = base.to("hsl");
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      const lightness = 95 - (i * 90) / (count - 1);
      const c = new Color("hsl", [hsl.coords[0], hsl.coords[1], lightness]);
      results.push(hexFromColor(c));
    }
    return results;
  } catch {
    return Array(count).fill("#000000");
  }
}

function generateHarmonies(baseHex: string) {
  try {
    const base = new Color(baseHex);
    const hsl = base.to("hsl");
    const h = hsl.coords[0] || 0;
    const s = hsl.coords[1];
    const l = hsl.coords[2];

    const makeHex = (hue: number) => hexFromColor(new Color("hsl", [(hue + 360) % 360, s, l]));

    return {
      complementary: [baseHex, makeHex(h + 180)],
      analogous: [makeHex(h - 30), baseHex, makeHex(h + 30)],
      triadic: [baseHex, makeHex(h + 120), makeHex(h + 240)],
      splitComplementary: [baseHex, makeHex(h + 150), makeHex(h + 210)],
      tetradic: [baseHex, makeHex(h + 90), makeHex(h + 180), makeHex(h + 270)],
    };
  } catch {
    return {
      complementary: [baseHex, "#000000"],
      analogous: ["#000000", baseHex, "#000000"],
      triadic: [baseHex, "#000000", "#000000"],
      splitComplementary: [baseHex, "#000000", "#000000"],
      tetradic: [baseHex, "#000000", "#000000", "#000000"],
    };
  }
}

function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const c1 = new Color(hex1);
    const c2 = new Color(hex2);
    const l1 = c1.to("srgb").luminance;
    const l2 = c2.to("srgb").luminance;
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    return 1;
  }
}

function getWCAGRating(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

// Color blindness simulation matrices (approximate)
function simulateColorBlindness(hex: string) {
  try {
    const c = new Color(hex).to("srgb");
    const r = c.coords[0] ?? 0;
    const g = c.coords[1] ?? 0;
    const b = c.coords[2] ?? 0;

    const simulate = (matrix: number[][]) => {
      const nr = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
      const ng = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
      const nb = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;
      const clamp = (v: number) => Math.max(0, Math.min(1, v));
      return hexFromColor(new Color("srgb", [clamp(nr), clamp(ng), clamp(nb)]));
    };

    return {
      protanopia: simulate([
        [0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758],
      ]),
      deuteranopia: simulate([
        [0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7],
      ]),
      tritanopia: simulate([
        [0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525],
      ]),
      achromatopsia: simulate([
        [0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114],
      ]),
    };
  } catch {
    return { protanopia: hex, deuteranopia: hex, tritanopia: hex, achromatopsia: hex };
  }
}

// --- Tab Button Component ---
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
        active
          ? "bg-[#c5030c]/10 text-[#c5030c] shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// --- Swatch Component ---
function Swatch({ color, label, onCopy }: { color: string; label?: string; onCopy: (v: string) => void }) {
  return (
    <button
      onClick={() => onCopy(color)}
      className="group flex flex-col items-center gap-1"
      title={`Copy ${color}`}
    >
      <div
        className="size-10 rounded-lg border border-border/60 shadow-sm transition-transform group-hover:scale-110"
        style={{ backgroundColor: color }}
      />
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
    </button>
  );
}

// --- Main Component ---
export function ColorPickerTool() {
  const [hex, setHex] = useState("#c5030c");
  const [rgb, setRgb] = useState("rgb(197, 3, 12)");
  const [hsl, setHsl] = useState("hsl(357, 97%, 39%)");
  const [oklch, setOklch] = useState("oklch(0.521 0.215 27.3)");
  const [currentColor, setCurrentColor] = useState("#c5030c");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("converter");

  // Contrast checker state
  const [contrastFg, setContrastFg] = useState("#000000");
  const [contrastBg, setContrastBg] = useState("#ffffff");

  // Gradient builder state
  const [gradientStops, setGradientStops] = useState<string[]>(["#c5030c", "#1e40af"]);
  const [gradientAngle, setGradientAngle] = useState(90);

  const updateAllFormats = useCallback((value: string, source: "hex" | "rgb" | "hsl" | "oklch") => {
    try {
      const color = new Color(value);
      setCurrentColor(hexFromColor(color));
      if (source !== "hex") setHex(hexFromColor(color));
      if (source !== "rgb") setRgb(color.to("srgb").toString({ format: "rgb" }));
      if (source !== "hsl") setHsl(color.to("hsl").toString({ format: "hsl" }));
      if (source !== "oklch") setOklch(color.to("oklch").toString());
    } catch {
      // Invalid color — allow typing
    }
  }, []);

  const handleInputChange = (value: string, source: "hex" | "rgb" | "hsl" | "oklch") => {
    if (source === "hex") setHex(value);
    if (source === "rgb") setRgb(value);
    if (source === "hsl") setHsl(value);
    if (source === "oklch") setOklch(value);
    updateAllFormats(value, source);
  };

  const handleCopy = async (value: string, field?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedField(field || value);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Computed values
  const shades = useMemo(() => generateShades(currentColor, 11), [currentColor]);
  const harmonies = useMemo(() => generateHarmonies(currentColor), [currentColor]);
  const blindness = useMemo(() => simulateColorBlindness(currentColor), [currentColor]);
  const contrastRatio = useMemo(() => getContrastRatio(contrastFg, contrastBg), [contrastFg, contrastBg]);
  const wcag = useMemo(() => getWCAGRating(contrastRatio), [contrastRatio]);
  const gradientCSS = useMemo(
    () => `linear-gradient(${gradientAngle}deg, ${gradientStops.join(", ")})`,
    [gradientAngle, gradientStops]
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "converter", label: "Converter" },
    { id: "shades", label: "Shades & Tints" },
    { id: "harmonies", label: "Harmonies" },
    { id: "gradient", label: "Gradient" },
    { id: "contrast", label: "Contrast" },
    { id: "blindness", label: "Color Blindness" },
  ];

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Color Picker"
        description="Pick colors, generate shades & tints, explore harmonies, build gradients, check contrast, and simulate color blindness."
        icon={Palette}
      />

      {/* Color preview + native picker */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="relative size-14 overflow-hidden rounded-xl border border-border/60 shadow-sm shrink-0">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleInputChange(e.target.value, "hex")}
              className="absolute -top-2 -left-2 size-20 cursor-pointer opacity-0"
              title="Choose a color"
              aria-label="Color picker"
            />
            <div className="size-full pointer-events-none" style={{ backgroundColor: currentColor }} />
          </div>
          <div>
            <p className="font-mono text-lg font-semibold">{currentColor}</p>
            <p className="text-xs text-muted-foreground">Click the swatch to pick a color</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-card p-2">
        {tabs.map((tab) => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        {activeTab === "converter" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-3">Color Formats</h2>
            {([
              { id: "hex", label: "HEX", value: hex, placeholder: "#000000" },
              { id: "rgb", label: "RGB", value: rgb, placeholder: "rgb(0, 0, 0)" },
              { id: "hsl", label: "HSL", value: hsl, placeholder: "hsl(0, 0%, 0%)" },
              { id: "oklch", label: "OKLCH", value: oklch, placeholder: "oklch(0 0 0)" },
            ] as const).map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={`${field.id}-input`} className="text-xs font-medium">{field.label}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`${field.id}-input`}
                    value={field.value}
                    onChange={(e) => handleInputChange(e.target.value, field.id)}
                    className="font-mono text-sm"
                    placeholder={field.placeholder}
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(field.value, field.id)}
                    title={copiedField === field.id ? "Copied!" : `Copy ${field.label}`}
                  >
                    {copiedField === field.id ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "shades" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Shades & Tints</h2>
            <p className="text-xs text-muted-foreground">From lightest tint to darkest shade. Click any swatch to copy its hex value.</p>
            <div className="flex flex-wrap gap-3">
              {shades.map((shade, i) => (
                <Swatch key={i} color={shade} label={i === 0 ? "Lightest" : i === shades.length - 1 ? "Darkest" : undefined} onCopy={handleCopy} />
              ))}
            </div>
            {/* Full-width gradient bar */}
            <div
              className="h-8 w-full rounded-lg border border-border/60"
              style={{ background: `linear-gradient(to right, ${shades.join(", ")})` }}
            />
          </div>
        )}

        {activeTab === "harmonies" && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold">Color Harmonies</h2>
            <p className="text-xs text-muted-foreground">Based on color wheel relationships. Click any swatch to copy.</p>
            {Object.entries(harmonies).map(([name, colors]) => (
              <div key={name} className="space-y-2">
                <h3 className="text-xs font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c, i) => (
                    <Swatch key={i} color={c} onCopy={handleCopy} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "gradient" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Gradient Builder</h2>
            <div
              className="h-32 w-full rounded-xl border border-border/60 shadow-inner"
              style={{ background: gradientCSS }}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-medium w-14 shrink-0">Angle</Label>
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                  className="w-20 font-mono text-sm"
                />
                <span className="text-xs text-muted-foreground">deg</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Color Stops</Label>
                {gradientStops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative size-8 overflow-hidden rounded-md border border-border/60 shrink-0">
                      <input
                        type="color"
                        value={stop}
                        onChange={(e) => {
                          const newStops = [...gradientStops];
                          newStops[i] = e.target.value;
                          setGradientStops(newStops);
                        }}
                        className="absolute -top-1 -left-1 size-12 cursor-pointer opacity-0"
                        aria-label={`Gradient stop ${i + 1}`}
                      />
                      <div className="size-full pointer-events-none" style={{ backgroundColor: stop }} />
                    </div>
                    <Input
                      value={stop}
                      onChange={(e) => {
                        const newStops = [...gradientStops];
                        newStops[i] = e.target.value;
                        setGradientStops(newStops);
                      }}
                      className="font-mono text-sm flex-1"
                    />
                    {gradientStops.length > 2 && (
                      <Button variant="secondary" size="icon" onClick={() => setGradientStops(gradientStops.filter((_, j) => j !== i))}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setGradientStops([...gradientStops, currentColor])}
                  className="text-xs"
                >
                  <Plus className="size-3.5 mr-1" /> Add Stop
                </Button>
              </div>
            </div>
            {/* CSS output */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CSS</Label>
              <div className="flex gap-2">
                <Input value={gradientCSS} readOnly className="font-mono text-xs" />
                <Button variant="secondary" size="icon" onClick={() => handleCopy(gradientCSS, "gradient-css")}>
                  {copiedField === "gradient-css" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contrast" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Contrast Checker</h2>
            <p className="text-xs text-muted-foreground">Check WCAG contrast ratio between two colors.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Foreground</Label>
                <div className="flex items-center gap-2">
                  <div className="relative size-8 overflow-hidden rounded-md border border-border/60 shrink-0">
                    <input
                      type="color"
                      value={contrastFg}
                      onChange={(e) => setContrastFg(e.target.value)}
                      className="absolute -top-1 -left-1 size-12 cursor-pointer opacity-0"
                      aria-label="Foreground color"
                    />
                    <div className="size-full pointer-events-none" style={{ backgroundColor: contrastFg }} />
                  </div>
                  <Input value={contrastFg} onChange={(e) => setContrastFg(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Background</Label>
                <div className="flex items-center gap-2">
                  <div className="relative size-8 overflow-hidden rounded-md border border-border/60 shrink-0">
                    <input
                      type="color"
                      value={contrastBg}
                      onChange={(e) => setContrastBg(e.target.value)}
                      className="absolute -top-1 -left-1 size-12 cursor-pointer opacity-0"
                      aria-label="Background color"
                    />
                    <div className="size-full pointer-events-none" style={{ backgroundColor: contrastBg }} />
                  </div>
                  <Input value={contrastBg} onChange={(e) => setContrastBg(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-xl p-6 border border-border/60"
              style={{ backgroundColor: contrastBg }}
            >
              <p className="text-2xl font-bold" style={{ color: contrastFg }}>
                Sample Text
              </p>
              <p className="text-sm mt-1" style={{ color: contrastFg }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>

            {/* Ratio */}
            <div className="text-center">
              <p className="text-3xl font-bold">{contrastRatio.toFixed(2)}:1</p>
              <p className="text-xs text-muted-foreground mt-1">Contrast Ratio</p>
            </div>

            {/* WCAG Results */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                { label: "AA Normal", pass: wcag.aa },
                { label: "AA Large", pass: wcag.aaLarge },
                { label: "AAA Normal", pass: wcag.aaa },
                { label: "AAA Large", pass: wcag.aaaLarge },
              ]).map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg p-3 text-center border ${
                    item.pass
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <p className={`text-xs font-bold ${item.pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {item.pass ? "PASS" : "FAIL"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "blindness" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Color Blindness Simulation</h2>
            <p className="text-xs text-muted-foreground">
              See how the current color appears to people with different types of color vision deficiency.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg border border-border/60" style={{ backgroundColor: currentColor }} />
                  <div>
                    <p className="text-xs font-medium">Normal Vision</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{currentColor}</p>
                  </div>
                </div>
              </div>
              {([
                { key: "protanopia" as const, label: "Protanopia", desc: "Red-blind (~1% of males)" },
                { key: "deuteranopia" as const, label: "Deuteranopia", desc: "Green-blind (~1% of males)" },
                { key: "tritanopia" as const, label: "Tritanopia", desc: "Blue-blind (~0.003%)" },
                { key: "achromatopsia" as const, label: "Achromatopsia", desc: "Total color blindness" },
              ]).map((type) => (
                <div key={type.key} className="rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-lg border border-border/60" style={{ backgroundColor: blindness[type.key] }} />
                    <div>
                      <p className="text-xs font-medium">{type.label}</p>
                      <p className="text-[10px] text-muted-foreground">{type.desc}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{blindness[type.key]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Side-by-side comparison bar */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Side-by-side Comparison</p>
              <div className="flex h-10 rounded-lg overflow-hidden border border-border/60">
                <div className="flex-1" style={{ backgroundColor: currentColor }} title="Normal" />
                <div className="flex-1" style={{ backgroundColor: blindness.protanopia }} title="Protanopia" />
                <div className="flex-1" style={{ backgroundColor: blindness.deuteranopia }} title="Deuteranopia" />
                <div className="flex-1" style={{ backgroundColor: blindness.tritanopia }} title="Tritanopia" />
                <div className="flex-1" style={{ backgroundColor: blindness.achromatopsia }} title="Achromatopsia" />
              </div>
              <div className="flex text-[9px] text-muted-foreground">
                <span className="flex-1 text-center">Normal</span>
                <span className="flex-1 text-center">Protan</span>
                <span className="flex-1 text-center">Deutan</span>
                <span className="flex-1 text-center">Tritan</span>
                <span className="flex-1 text-center">Achrom</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
