import { AIFeedbackDisplay } from "@/components/grading/ai-feedback-display"

export default function FeedbackDemoPage() {
  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">AI Grading Feedback Demo</h1>
          <p className="text-muted-foreground text-lg">
            Toggle between complex and simplified feedback versions
          </p>
        </div>
        <AIFeedbackDisplay />
      </div>
    </main>
  )
}
