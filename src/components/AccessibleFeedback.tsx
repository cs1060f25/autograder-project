"use client"

import * as React from "react"
import { Volume2, Languages } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AccessibleFeedbackProps {
  audioSrc?: string
  className?: string
}

const transcripts = {
  en: [
    "Great work on this assignment!",
    "Your code structure is well-organized and follows best practices.",
    "However, I noticed a few areas where you could improve error handling.",
    "Consider adding more descriptive variable names in the helper functions.",
    "Overall, this is a solid submission. Keep up the good work!",
  ],
  es: [
    "¡Excelente trabajo en esta tarea!",
    "La estructura de tu código está bien organizada y sigue las mejores prácticas.",
    "Sin embargo, noté algunas áreas donde podrías mejorar el manejo de errores.",
    "Considera agregar nombres de variables más descriptivos en las funciones auxiliares.",
    "En general, esta es una presentación sólida. ¡Sigue con el buen trabajo!",
  ],
}

export function AccessibleFeedback({ audioSrc, className }: AccessibleFeedbackProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentLine, setCurrentLine] = React.useState(0)
  const [language, setLanguage] = React.useState<"en" | "es">("en")
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        audioRef.current.play()
        // Simulate caption progression (each line appears every 3 seconds)
        intervalRef.current = setInterval(() => {
          setCurrentLine((prev) => {
            if (prev < transcripts[language].length - 1) {
              return prev + 1
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              return prev
            }
          })
        }, 3000)
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value as "en" | "es")
    setCurrentLine(0)
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <Card className={cn("w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="size-5" />
          Instructor Voice Feedback
        </CardTitle>
        <CardDescription>
          Audio feedback with AI-generated captions for accessibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Player */}
        <div className="flex items-center gap-4">
          <audio
            ref={audioRef}
            src={audioSrc || "/audio/feedback-sample.mp3"}
            onEnded={() => {
              setIsPlaying(false)
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
            }}
            className="hidden"
          />
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
            aria-label={isPlaying ? "Pause audio feedback" : "Play audio feedback"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="text-sm font-medium">Audio Feedback</div>
            <div className="text-xs text-muted-foreground">
              {isPlaying ? "Playing..." : "Click to play"}
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-3">
          <Languages className="size-4 text-muted-foreground" />
          <label htmlFor="language-select" className="text-sm font-medium">
            Translate Caption:
          </label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish (Español)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Transcript Display */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Live Transcript:</div>
          <div
            className="min-h-[200px] rounded-lg border bg-muted/30 p-4 space-y-2"
            role="region"
            aria-live="polite"
            aria-label="Live transcript of audio feedback"
          >
            {transcripts[language].slice(0, currentLine + 1).map((line, index) => (
              <p
                key={index}
                className={cn(
                  "text-sm leading-relaxed transition-all duration-500",
                  index === currentLine
                    ? "text-foreground font-medium animate-in fade-in slide-in-from-bottom-2"
                    : "text-muted-foreground"
                )}
              >
                {line}
              </p>
            ))}
            {currentLine === 0 && !isPlaying && (
              <p className="text-sm text-muted-foreground italic">
                Press play to start audio feedback and view captions...
              </p>
            )}
          </div>
        </div>

        {/* Accessibility Note */}
        <div className="rounded-lg bg-accent/50 border border-accent p-4">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 text-accent-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold text-accent-foreground">
                Accessibility Features
              </div>
              <p className="text-sm text-accent-foreground/80 leading-relaxed">
                AI-generated captions improve access for hearing-impaired users and provide
                additional context for all learners. Captions are synchronized with audio
                playback and support multiple languages for international students.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
