# Web Speech API Integration Guide

## Overview

The AI Feedback Interface now uses the **Web Speech API** for real text-to-speech and speech recognition capabilities. This guide explains how to use and test the features.

## Quick Start

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the demo page**:
   Navigate to `http://localhost:3001/demo-feedback`

3. **Test Text-to-Speech**:
   - Click the "🔊 Listen to Feedback" button
   - The AI feedback will be read aloud using your browser's TTS engine
   - Watch the animated waveform during playback
   - Click again to stop playback

4. **Test Speech Recognition**:
   - Click the "🎙️ Record Response" button
   - Allow microphone access when prompted
   - Speak clearly into your microphone
   - Watch your words appear in real-time in the transcript area
   - Click "Stop Recording" when finished
   - Click "Save Response" to save the transcript

## Browser Requirements

### Recommended Browsers
- **Google Chrome** (version 25+) - ✅ Full support
- **Microsoft Edge** (version 79+) - ✅ Full support

### Partial Support
- **Safari** (version 14.1+) - ✅ TTS works, limited speech recognition
- **Firefox** (version 49+) - ✅ TTS works, ❌ no speech recognition

### What You'll Need
1. A modern browser (Chrome or Edge recommended)
2. Microphone access for speech recognition
3. Speakers or headphones for text-to-speech
4. Internet connection (speech recognition uses cloud services)

## Features Explained

### 1. Text-to-Speech (SpeechSynthesis API)

**How it works:**
- Converts the AI feedback text into spoken audio
- Uses your browser's built-in TTS engine
- No external API calls or costs
- Works offline (after initial voice download)

**Configuration:**
- **Rate**: 0.9 (slightly slower for clarity)
- **Pitch**: 1.0 (normal)
- **Volume**: 1.0 (maximum)
- **Voice**: Automatically selects best English voice (prefers Google voices)

**Supported Languages:**
Currently configured for English (en-US), but can be extended to support:
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- And 40+ other languages

### 2. Speech Recognition (SpeechRecognition API)

**How it works:**
- Captures audio from your microphone
- Sends audio to cloud service for processing
- Returns text transcript in real-time
- Shows both interim (in-progress) and final results

**Configuration:**
- **Continuous**: true (keeps listening until stopped)
- **Interim Results**: true (shows text as you speak)
- **Language**: en-US
- **Max Alternatives**: 1 (best guess only)

**Privacy Note:**
Audio is sent to Google's servers for processing. For privacy-sensitive applications, consider using on-device speech recognition or alternative services.

## Error Handling

The interface includes comprehensive error handling:

### Text-to-Speech Errors
- **Browser not supported**: Shows warning banner
- **Playback error**: Displays error message and stops playback
- **Voice not available**: Falls back to default system voice

### Speech Recognition Errors
- **no-speech**: "No speech detected. Please try again."
- **audio-capture**: "Microphone not found. Please check your device."
- **not-allowed**: "Microphone permission denied. Please allow microphone access."
- **network**: "Network error. Please check your connection."

## Troubleshooting

### Text-to-Speech Not Working

**Problem**: No sound when clicking "Listen to Feedback"

**Solutions**:
1. Check browser compatibility (use Chrome/Edge)
2. Verify system volume is not muted
3. Check browser console for errors
4. Try refreshing the page
5. Ensure browser has permission to play audio

### Speech Recognition Not Working

**Problem**: No transcript appears when speaking

**Solutions**:
1. **Check microphone permission**:
   - Click the lock icon in address bar
   - Ensure microphone is allowed
   - Refresh the page after granting permission

2. **Verify microphone is working**:
   - Test in system settings
   - Try another application (e.g., Zoom, Discord)
   - Check if microphone is selected as default device

3. **Browser compatibility**:
   - Use Chrome or Edge (Firefox doesn't support speech recognition)
   - Update browser to latest version

4. **Network connection**:
   - Speech recognition requires internet
   - Check your connection is stable

5. **Speak clearly**:
   - Speak at normal pace
   - Avoid background noise
   - Position microphone 6-12 inches from mouth

### Transcript Keeps Stopping

**Problem**: Recording stops after a few seconds

**Solution**: This is normal behavior. The component automatically restarts recognition if it stops unexpectedly. Just keep speaking.

## Advanced Usage

### Customizing Voice Settings

To change TTS settings, modify the component:

```typescript
// In ai-feedback-interface.tsx
utterance.rate = 1.2;  // Faster speech
utterance.pitch = 0.8; // Lower pitch
utterance.volume = 0.7; // Quieter
```

### Changing Recognition Language

To support other languages:

```typescript
// In ai-feedback-interface.tsx
recognition.lang = 'es-ES'; // Spanish
recognition.lang = 'fr-FR'; // French
recognition.lang = 'de-DE'; // German
```

### Adding Voice Selection UI

You can let users choose their preferred voice:

```typescript
// Get available voices
const voices = window.speechSynthesis.getVoices();

// Display in dropdown
voices.forEach(voice => {
  console.log(`${voice.name} (${voice.lang})`);
});

// Set selected voice
utterance.voice = voices[selectedIndex];
```

## Performance Tips

1. **Lazy Loading**: Voices are loaded on first use
2. **Caching**: Browser caches voice data
3. **Debouncing**: Transcript updates are batched
4. **Memory Management**: Recognition is stopped on unmount

## Security Considerations

### Permissions
- Microphone access requires user permission
- Permission is requested only when recording starts
- Users can revoke permission at any time

### Data Privacy
- TTS: All processing happens locally in browser
- Speech Recognition: Audio sent to cloud (Google)
- No audio is stored by the application
- Transcripts are only stored if user clicks "Save"

### Best Practices
1. Always explain why microphone access is needed
2. Provide visual feedback when recording
3. Allow users to review transcript before saving
4. Implement proper error handling
5. Respect user privacy preferences

## Testing Checklist

Before deploying to production:

- [ ] Test in Chrome (latest version)
- [ ] Test in Edge (latest version)
- [ ] Test in Safari (if targeting Mac/iOS users)
- [ ] Test with different microphones
- [ ] Test in quiet and noisy environments
- [ ] Test with different accents
- [ ] Verify error messages display correctly
- [ ] Test permission denial flow
- [ ] Test network disconnection during recording
- [ ] Verify cleanup on component unmount
- [ ] Test keyboard navigation
- [ ] Test with screen reader

## API Reference

### SpeechSynthesis API

```typescript
// Create utterance
const utterance = new SpeechSynthesisUtterance(text);

// Configure
utterance.rate = 0.9;
utterance.pitch = 1.0;
utterance.volume = 1.0;
utterance.voice = selectedVoice;

// Event handlers
utterance.onstart = () => console.log('Started');
utterance.onend = () => console.log('Finished');
utterance.onerror = (e) => console.error(e);

// Control
window.speechSynthesis.speak(utterance);
window.speechSynthesis.pause();
window.speechSynthesis.resume();
window.speechSynthesis.cancel();
```

### SpeechRecognition API

```typescript
// Create recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Configure
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// Event handlers
recognition.onresult = (event) => {
  // Process results
};
recognition.onerror = (event) => {
  // Handle errors
};
recognition.onend = () => {
  // Recognition stopped
};

// Control
recognition.start();
recognition.stop();
recognition.abort();
```

## Resources

### Documentation
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [SpeechRecognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

### Browser Support
- [Can I Use - Speech Synthesis](https://caniuse.com/speech-synthesis)
- [Can I Use - Speech Recognition](https://caniuse.com/speech-recognition)

### Alternatives
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)
- [Azure Speech Services](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/)
- [AWS Transcribe](https://aws.amazon.com/transcribe/)
- [Amazon Polly](https://aws.amazon.com/polly/)

## Support

For issues or questions:
1. Check browser console for errors
2. Review this guide's troubleshooting section
3. Test in a different browser
4. Contact the development team

---

**Last Updated**: October 16, 2025  
**Version**: 2.0.0  
**Status**: Production Ready
