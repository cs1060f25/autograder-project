"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Volume2, Mic, StopCircle, X, AlertCircle } from "lucide-react";

interface AIFeedbackInterfaceProps {
  feedback: string;
  onResponseRecorded?: (transcript: string) => void;
}

export function AIFeedbackInterface({
  feedback,
  onResponseRecorded,
}: AIFeedbackInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserSupport, setBrowserSupport] = useState({
    speechSynthesis: false,
    speechRecognition: false,
  });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      const hasSpeechSynthesis = 'speechSynthesis' in window;
      const hasSpeechRecognition = 
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      
      setBrowserSupport({
        speechSynthesis: hasSpeechSynthesis,
        speechRecognition: hasSpeechRecognition,
      });
    };
    
    checkSupport();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (utteranceRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const handlePlayFeedback = () => {
    if (!browserSupport.speechSynthesis) {
      setError("Text-to-speech is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isPlaying) {
      // Stop playback
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      // Start playback using Web Speech API
      setIsPlaying(true);
      setError(null);

      const utterance = new SpeechSynthesisUtterance(feedback);
      utteranceRef.current = utterance;

      // Configure voice settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to use a high-quality voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers
      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setError('An error occurred during playback. Please try again.');
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartRecording = () => {
    if (!browserSupport.speechRecognition) {
      setError("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    setShowRecordingModal(true);
    setIsRecording(true);
    setRecordingTime(0);
    setTranscript("");
    setError(null);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcript with both final and interim results
      setTranscript((prev) => {
        const newTranscript = prev + finalTranscript;
        return newTranscript + (interimTranscript ? ' ' + interimTranscript : '');
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      let errorMessage = 'An error occurred during recording.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your device.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      setError(errorMessage);
    };

    recognition.onend = () => {
      // If recording was stopped intentionally, this is fine
      // Otherwise, restart if still in recording mode
      if (isRecording && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or stopped
        }
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  };

  const handleSaveRecording = () => {
    if (onResponseRecorded && transcript) {
      onResponseRecorded(transcript);
    }
    setShowRecordingModal(false);
    setRecordingTime(0);
    setTranscript("");
  };

  const handleCancelRecording = () => {
    handleStopRecording();
    setShowRecordingModal(false);
    setRecordingTime(0);
    setTranscript("");
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Browser Support Warning */}
      {(!browserSupport.speechSynthesis || !browserSupport.speechRecognition) && (
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Browser Compatibility</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                {!browserSupport.speechSynthesis && (
                  <p>• Text-to-speech is not supported in your browser.</p>
                )}
                {!browserSupport.speechRecognition && (
                  <p>• Speech recognition is not supported in your browser.</p>
                )}
                <p className="mt-2 font-medium">
                  For the best experience, please use Chrome, Edge, or Safari.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Feedback Section */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md">
            <span className="text-xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Generated Feedback
          </h3>
        </div>

        <div className="mb-6 rounded-lg bg-white p-5 shadow-sm">
          <p className="text-base leading-relaxed text-gray-800">{feedback}</p>
        </div>

        {/* Listen to Feedback Button */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handlePlayFeedback}
            size="lg"
            className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            aria-label="Listen to feedback using text-to-speech"
          >
            <Volume2 className="mr-3 h-6 w-6" />
            {isPlaying ? "🔊 Playing Feedback..." : "🔊 Listen to Feedback"}
          </Button>

          {/* Waveform Animation */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-1 py-4 px-6 bg-white rounded-lg shadow-sm">
              <div className="flex items-end gap-1 h-12">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: "0.6s",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-center text-gray-600 px-2">
            <span className="font-medium">Accessibility:</span> Click the button
            above to hear the AI feedback read aloud using text-to-speech
            technology
          </p>
        </div>
      </div>

      {/* Voice Response Section */}
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-md">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Voice Response
          </h3>
        </div>

        <Button
          onClick={handleStartRecording}
          size="lg"
          className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          aria-label="Record a voice response to the feedback"
        >
          <Mic className="mr-3 h-6 w-6" />
          🎙️ Record Response
        </Button>

        <p className="mt-3 text-sm text-center text-gray-600 px-2">
          <span className="font-medium">Accessibility:</span> Click to record a
          voice response that will be transcribed to text automatically
        </p>
      </div>

      {/* Recording Modal */}
      <Dialog open={showRecordingModal} onOpenChange={setShowRecordingModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mic className="h-6 w-6 text-green-600" />
              Voice Recording
            </DialogTitle>
            <DialogDescription>
              Speak your response clearly. Your voice will be transcribed
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error in Modal */}
            {error && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Recording Timer and Controls */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-bold text-gray-900 tabular-nums">
                {formatTime(recordingTime)}
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-medium text-red-600">
                    Recording...
                  </span>
                </div>
              )}

              {/* Visual Microphone Animation */}
              {isRecording && (
                <div className="relative flex items-center justify-center w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
                  <div className="absolute inset-4 rounded-full bg-green-500 opacity-40 animate-pulse" />
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                    <Mic className="h-10 w-10 text-white" />
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-3">
                {isRecording ? (
                  <Button
                    onClick={handleStopRecording}
                    size="lg"
                    variant="destructive"
                    className="h-14 px-8 text-base font-semibold"
                  >
                    <StopCircle className="mr-2 h-5 w-5" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartRecording}
                    size="lg"
                    className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Resume Recording
                  </Button>
                )}
              </div>
            </div>

            {/* Transcript Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Transcript Preview
                </label>
                {transcript && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Transcription active
                  </span>
                )}
              </div>
              <div className="min-h-[120px] max-h-[200px] overflow-y-auto rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
                {transcript ? (
                  <p className="text-sm leading-relaxed text-gray-800">
                    {transcript}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Your speech will appear here as text...
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={handleCancelRecording}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveRecording}
                disabled={!transcript}
                size="lg"
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Save Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
