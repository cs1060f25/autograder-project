"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { simplifyFeedback, analyzeReadingLevel } from "@/lib/gemini"
import { Loader2 } from "lucide-react"

// Sample complex feedback
const complexFeedback = `Your implementation demonstrates a fundamental understanding of the algorithm's core principles. However, there are several areas that require refinement to achieve optimal performance and adherence to best practices.

First, your time complexity analysis reveals an O(n²) solution where an O(n log n) approach would be more appropriate. The nested iteration structure in lines 23-31 creates unnecessary computational overhead. Consider implementing a divide-and-conquer strategy or utilizing a more efficient data structure such as a balanced binary search tree or hash map to reduce the algorithmic complexity.

Second, your code lacks proper error handling mechanisms. The function assumes all inputs are valid and well-formed, which could lead to runtime exceptions in production environments. Implement comprehensive input validation and exception handling to ensure robustness.

Additionally, the variable naming conventions could be improved for better code readability. Single-letter variables like 'x', 'y', and 'z' should be replaced with descriptive identifiers that clearly communicate their purpose within the algorithm's context.

Finally, while your solution produces correct output for the provided test cases, it fails to account for edge cases such as empty arrays, null values, or extremely large datasets that might cause memory constraints.`

export function AIFeedbackDisplay() {
  const [isSimplified, setIsSimplified] = React.useState(false)
  const [simplifiedText, setSimplifiedText] = React.useState<string>("")
  const [complexReadingLevel, setComplexReadingLevel] = React.useState<string>("Analyzing...")
  const [simpleReadingLevel, setSimpleReadingLevel] = React.useState<string>("Analyzing...")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")

  // Analyze reading level of complex feedback on mount
  React.useEffect(() => {
    analyzeReadingLevel(complexFeedback).then(setComplexReadingLevel)
  }, [])

  // Handle toggle change
  const handleToggleChange = async (checked: boolean) => {
    if (checked && !simplifiedText) {
      setIsLoading(true)
      setError("")
      try {
        const simplified = await simplifyFeedback(complexFeedback)
        setSimplifiedText(simplified)
        const readingLevel = await analyzeReadingLevel(simplified)
        setSimpleReadingLevel(readingLevel)
        setIsSimplified(true)
      } catch (err) {
        setError("Failed to simplify feedback. Please try again.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsSimplified(checked)
    }
  }

  const currentText = isSimplified ? simplifiedText : complexFeedback
  const currentReadingLevel = isSimplified ? simpleReadingLevel : complexReadingLevel

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">AI Grading Feedback</CardTitle>
          <CardAction>
            <div className="flex items-center space-x-3">
              <Label htmlFor="simplify-toggle" className="text-sm font-medium cursor-pointer">
                Simplify Feedback
              </Label>
              <Switch
                id="simplify-toggle"
                checked={isSimplified}
                onCheckedChange={handleToggleChange}
                disabled={isLoading}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg text-muted-foreground">
                Simplifying feedback with AI...
              </span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div className="prose prose-lg max-w-none">
                <div className="text-lg leading-relaxed whitespace-pre-line text-foreground">
                  {currentText}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">
                    Reading Level:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {currentReadingLevel}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
