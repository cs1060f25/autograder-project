"use client";

import React, { useState } from "react";
import { AIFeedbackInterface } from "@/components/grading/ai-feedback-interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DemoFeedbackPage() {
  const [savedResponse, setSavedResponse] = useState<string | null>(null);

  const sampleFeedback = `Great work on this assignment! Your solution demonstrates a solid understanding of the core concepts. Here are some key observations:

**Strengths:**
• Your code is well-structured and follows best practices
• You've included comprehensive error handling
• The logic is clear and easy to follow
• Good use of comments to explain complex sections

**Areas for Improvement:**
• Consider optimizing the nested loops in the main function for better performance
• The variable naming could be more descriptive in some places
• Adding unit tests would strengthen your submission

**Overall:** You've earned a strong grade of 88/100. Keep up the excellent work! If you have questions about the feedback, feel free to reach out during office hours.`;

  const handleResponseRecorded = (transcript: string) => {
    setSavedResponse(transcript);
    console.log("Voice response recorded:", transcript);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Grading Feedback Interface
          </h1>
          <p className="text-lg text-gray-600">
            Prototype demonstration of text-to-speech and voice input features
          </p>
        </div>

        {/* Assignment Context Card */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl">Assignment: Data Structures Final Project</CardTitle>
            <CardDescription className="text-base">
              CS 1060 - Introduction to Computer Science • Due: March 15, 2024
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Your Score</p>
                <p className="text-3xl font-bold text-blue-600">88/100</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Class Average</p>
                <p className="text-3xl font-bold text-green-600">82/100</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Percentile</p>
                <p className="text-3xl font-bold text-purple-600">Top 25%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Feedback Interface */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-xl">Interactive Feedback</CardTitle>
            <CardDescription>
              Listen to your feedback or record a voice response
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AIFeedbackInterface
              feedback={sampleFeedback}
              onResponseRecorded={handleResponseRecorded}
            />
          </CardContent>
        </Card>

        {/* Saved Response Display */}
        {savedResponse && (
          <Card className="border-2 border-green-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-xl text-green-700">
                <CheckCircle2 className="h-6 w-6" />
                Response Saved Successfully
              </CardTitle>
              <CardDescription>
                Your voice response has been transcribed and saved
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Your Transcribed Response:
                </p>
                <p className="text-base text-gray-800 leading-relaxed">
                  {savedResponse}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Information */}
        <Card className="mt-6 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="text-xl">Accessibility Features</CardTitle>
            <CardDescription>
              This interface is designed with accessibility in mind
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg">🔊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Text-to-Speech
                  </h4>
                  <p className="text-sm text-gray-600">
                    Listen to your feedback read aloud with natural-sounding voice synthesis.
                    Perfect for auditory learners or when reviewing on the go.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg">🎙️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Voice Input
                  </h4>
                  <p className="text-sm text-gray-600">
                    Record questions or responses using your voice. The system automatically
                    transcribes your speech to text for easy submission.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-lg">♿</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Universal Design
                  </h4>
                  <p className="text-sm text-gray-600">
                    Large touch-friendly buttons, high contrast colors, clear labels, and
                    ARIA attributes ensure the interface works for everyone.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
          <h3 className="font-semibold text-gray-900 mb-3 text-lg">
            🎉 Now Using Web Speech API!
          </h3>
          <div className="space-y-3 text-sm text-gray-800">
            <div className="p-3 bg-white rounded-lg">
              <p className="font-semibold mb-1">✅ Text-to-Speech (SpeechSynthesis API)</p>
              <p>
                Click "Listen to Feedback" to hear the AI feedback read aloud using your browser's
                built-in text-to-speech engine. Works in Chrome, Edge, Safari, and Firefox.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-semibold mb-1">✅ Speech Recognition (Web Speech API)</p>
              <p>
                Click "Record Response" to speak your response. Your speech will be transcribed
                in real-time. <strong>Note:</strong> Requires microphone permission and works best in Chrome/Edge.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-semibold mb-1">🔒 Privacy & Permissions</p>
              <p>
                Your browser will request microphone access for voice recording. Speech recognition
                may send audio to cloud services for processing. All data is processed securely.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-semibold mb-1">🌐 Browser Compatibility</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Chrome/Edge:</strong> Full support for both features</li>
                <li><strong>Safari:</strong> TTS supported, limited speech recognition</li>
                <li><strong>Firefox:</strong> TTS supported, no speech recognition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
