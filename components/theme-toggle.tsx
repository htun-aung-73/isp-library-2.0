"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme =
      theme === 'light' ? 'dark' :
        theme === 'dark' ? 'system' :
          'light'

    const x = (e.clientX / window.innerWidth) * 100 + "%"
    const y = (e.clientY / window.innerHeight) * 100 + "%"

    document.documentElement.style.setProperty("--x", x)
    document.documentElement.style.setProperty("--y", y)

    if (!(document as any).startViewTransition) {
      setTheme(nextTheme)
      return
    }

    (document as any).startViewTransition(() => {
      setTheme(nextTheme)
    })
  }

  // Get tooltip text based on current theme
  const getTooltipText = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme})`
    }
    return theme === 'light' ? 'Light mode' : 'Dark mode'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="theme-toggle-btn h-9 w-9 rounded-full bg-background/50 hover:bg-accent/50 transition-all duration-300 border border-border/50 relative overflow-hidden shrink-0"
            aria-label={`Theme: ${theme}`}
          >
            {theme === 'system' ? (
              <Monitor className="h-[1.2rem] w-[1.2rem] transition-all duration-500" />
            ) : (
              <>
                <Sun
                  className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ${theme === "light"
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-0 opacity-0"
                    }`}
                />
                <Moon
                  className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ${theme === "dark"
                      ? "rotate-0 scale-100 opacity-100"
                      : "rotate-90 scale-0 opacity-0"
                    }`}
                />
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}