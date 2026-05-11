import { Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme, type ThemeBackground, type ThemeColor } from "@/hooks/useTheme";

interface ColorOption {
  value: ThemeColor;
  label: string;
  swatch: string;
}

interface BgOption {
  value: ThemeBackground;
  label: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { value: "peach", label: "Peach", swatch: "hsl(15 85% 68%)" },
  { value: "blue", label: "Blue", swatch: "hsl(217 91% 60%)" },
  { value: "pink", label: "Pink", swatch: "hsl(340 75% 64%)" },
  { value: "green", label: "Green", swatch: "hsl(160 84% 39%)" },
  { value: "purple", label: "Purple", swatch: "hsl(271 81% 56%)" },
  { value: "beige", label: "Beige", swatch: "hsl(35 50% 70%)" },
];

const BG_OPTIONS: BgOption[] = [
  { value: "none", label: "Off" },
  { value: "default", label: "Blobs" },
  { value: "tiles", label: "Cards" },
];

export function ThemeSelector(): React.ReactElement {
  const { theme, setColor, toggleMode, setBackground } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme settings">
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4" align="end">
        <div className="space-y-4">
          <section aria-label="Color accent">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Color
            </p>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  aria-label={opt.label}
                  aria-pressed={theme.color === opt.value}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: opt.swatch,
                    boxShadow:
                      theme.color === opt.value
                        ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${opt.swatch}`
                        : "none",
                  }}
                />
              ))}
            </div>
          </section>

          <section aria-label="Style">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Style
            </p>
            <div className="flex flex-col gap-1.5">
              {BG_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={theme.background === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackground(opt.value)}
                  aria-pressed={theme.background === opt.value}
                  className="w-full justify-start text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </section>

          <section aria-label="Mode">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Mode
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className="w-full gap-2"
              aria-label={theme.mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme.mode === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </>
              )}
            </Button>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
