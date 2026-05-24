"use client";

import { useState, useEffect, useCallback } from "react";
import Color from "colorjs.io";
import { Copy, Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolDetailHeader } from "@/components/tool-detail-header";

export function ColorConverterTool() {
  const [hex, setHex] = useState("#c5030c");
  const [rgb, setRgb] = useState("rgb(197, 3, 12)");
  const [hsl, setHsl] = useState("hsl(357, 97%, 39%)");
  const [oklch, setOklch] = useState("oklch(0.521 0.215 27.3)");
  const [currentColor, setCurrentColor] = useState("#c5030c");
  
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Initialize with a default color
  useEffect(() => {
    updateAllFormats("#c5030c", "hex");
  }, []);

  const updateAllFormats = useCallback((value: string, source: "hex" | "rgb" | "hsl" | "oklch") => {
    try {
      const color = new Color(value);
      
      // Update the preview color
      setCurrentColor(color.to("srgb").toString({ format: "hex" }));

      if (source !== "hex") {
        setHex(color.to("srgb").toString({ format: "hex" }));
      }
      if (source !== "rgb") {
        setRgb(color.to("srgb").toString({ format: "rgb" }));
      }
      if (source !== "hsl") {
        const hslStr = color.to("hsl").toString({ format: "hsl" });
        // Sometimes colorjs.io outputs with deg, let's keep it standard
        setHsl(hslStr);
      }
      if (source !== "oklch") {
        // oklch needs to be formatted with enough precision but not too much
        setOklch(color.to("oklch").toString());
      }
    } catch (e) {
      // Invalid color, just don't update other fields to allow typing
    }
  }, []);

  const handleInputChange = (value: string, source: "hex" | "rgb" | "hsl" | "oklch") => {
    if (source === "hex") setHex(value);
    if (source === "rgb") setRgb(value);
    if (source === "hsl") setHsl(value);
    if (source === "oklch") setOklch(value);
    
    updateAllFormats(value, source);
  };

  const handleCopy = async (value: string, field: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Color Converter"
        description="Convert colors between HEX, RGB, HSL, and OKLCH formats instantly."
        icon={Palette}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="hex-input" className="text-sm font-medium">HEX</Label>
              <div className="flex gap-2">
                <Input
                  id="hex-input"
                  value={hex}
                  onChange={(e) => handleInputChange(e.target.value, "hex")}
                  className="font-mono"
                  placeholder="#000000"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleCopy(hex, "hex")}
                  title={copiedField === "hex" ? "Copied!" : "Copy HEX"}
                >
                  {copiedField === "hex" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rgb-input" className="text-sm font-medium">RGB</Label>
              <div className="flex gap-2">
                <Input
                  id="rgb-input"
                  value={rgb}
                  onChange={(e) => handleInputChange(e.target.value, "rgb")}
                  className="font-mono"
                  placeholder="rgb(0, 0, 0)"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleCopy(rgb, "rgb")}
                  title={copiedField === "rgb" ? "Copied!" : "Copy RGB"}
                >
                  {copiedField === "rgb" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsl-input" className="text-sm font-medium">HSL</Label>
              <div className="flex gap-2">
                <Input
                  id="hsl-input"
                  value={hsl}
                  onChange={(e) => handleInputChange(e.target.value, "hsl")}
                  className="font-mono"
                  placeholder="hsl(0, 0%, 0%)"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleCopy(hsl, "hsl")}
                  title={copiedField === "hsl" ? "Copied!" : "Copy HSL"}
                >
                  {copiedField === "hsl" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oklch-input" className="text-sm font-medium">OKLCH</Label>
              <div className="flex gap-2">
                <Input
                  id="oklch-input"
                  value={oklch}
                  onChange={(e) => handleInputChange(e.target.value, "oklch")}
                  className="font-mono"
                  placeholder="oklch(0 0 0)"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleCopy(oklch, "oklch")}
                  title={copiedField === "oklch" ? "Copied!" : "Copy OKLCH"}
                >
                  {copiedField === "oklch" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 h-full flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Preview</h2>
            <div 
              className="w-full flex-1 min-h-[200px] rounded-lg shadow-inner border border-black/10 dark:border-white/10"
              style={{ backgroundColor: currentColor }}
            />
            
            <div className="relative">
              <Label htmlFor="color-picker" className="sr-only">Color Picker</Label>
              <div className="flex items-center gap-3">
                <div className="relative size-10 overflow-hidden rounded-full border border-border/60 shadow-sm shrink-0">
                  <input
                    type="color"
                    id="color-picker"
                    value={currentColor}
                    onChange={(e) => handleInputChange(e.target.value, "hex")}
                    className="absolute -top-2 -left-2 size-16 cursor-pointer opacity-0"
                    title="Choose a color"
                  />
                  <div 
                    className="size-full pointer-events-none" 
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Click the circle to use the native color picker.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
