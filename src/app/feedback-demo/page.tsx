import { AccessibleFeedback } from "@/components/AccessibleFeedback"

export default function FeedbackDemoPage() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Grading Feedback Interface
          </h1>
          <p className="text-lg text-muted-foreground">
            Accessible audio feedback with AI-generated captions and multi-language support
          </p>
        </div>

        {/* Feedback Component */}
        <AccessibleFeedback />

        {/* Additional Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold">Key Features</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Audio playback controls with play/pause functionality</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Real-time caption display synchronized with audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Multi-language support (English and Spanish)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>WCAG-compliant accessibility features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Responsive design with strong text contrast</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold">Accessibility Benefits</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Supports hearing-impaired students with text captions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Enables learning in sound-sensitive environments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Provides translation for non-native English speakers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Allows students to review feedback at their own pace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>ARIA labels for screen reader compatibility</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
