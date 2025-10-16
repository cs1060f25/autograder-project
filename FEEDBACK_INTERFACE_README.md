# Grading Feedback Interface with Audio Comments

## Overview

This interface provides an accessible grading feedback system that supports audio comments with AI-generated captions. It's designed to improve accessibility for all students, particularly those who are hearing-impaired or non-native English speakers.

## Features

### 🎵 Audio Playback
- **Small Audio Player**: Labeled "Instructor Voice Feedback"
- **Play/Pause Controls**: Simple, intuitive playback controls
- **Visual Feedback**: Clear indication of playback status

### 📝 Dynamic Captions
- **Real-time Transcription**: AI-generated captions appear dynamically as audio plays
- **Synchronized Display**: Captions are timed to match audio content
- **Progressive Reveal**: Each line appears sequentially (every 3 seconds)
- **Visual Emphasis**: Current line is highlighted with animation

### 🌍 Multi-language Support
- **Translation Dropdown**: "Translate Caption" selector
- **Supported Languages**:
  - English (default)
  - Spanish (Español)
- **Instant Switching**: Language changes reset playback for accurate synchronization

### ♿ Accessibility Features
- **WCAG Compliance**: Follows Web Content Accessibility Guidelines
- **ARIA Labels**: Proper labeling for screen readers
- **Live Regions**: Captions use `aria-live="polite"` for screen reader announcements
- **High Contrast**: Strong text contrast ratios for readability
- **Keyboard Navigation**: Full keyboard support for all controls

### 📱 Responsive Design
- **Mobile-Friendly**: Adapts to all screen sizes
- **Flexible Layout**: Uses responsive grid and flexbox
- **Touch-Optimized**: Large touch targets for mobile devices

## Component Structure

### `AccessibleFeedback.tsx`
Main component that handles:
- Audio playback state management
- Caption synchronization
- Language switching
- Accessibility features

**Props:**
- `audioSrc?: string` - Optional custom audio source URL
- `className?: string` - Additional CSS classes for styling

### `page.tsx` (feedback-demo)
Demo page showcasing the feedback interface with:
- Component integration
- Feature descriptions
- Accessibility benefits documentation

## Usage

```tsx
import { AccessibleFeedback } from "@/components/AccessibleFeedback"

export default function MyPage() {
  return (
    <div>
      <AccessibleFeedback audioSrc="/path/to/audio.mp3" />
    </div>
  )
}
```

## Technical Implementation

### State Management
- `isPlaying`: Tracks audio playback state
- `currentLine`: Manages which caption line is currently displayed
- `language`: Controls the selected caption language
- `audioRef`: Reference to the HTML audio element
- `intervalRef`: Manages caption timing intervals

### Caption Timing
Captions are simulated to appear every 3 seconds. In a production environment, this would be replaced with:
- Real-time speech-to-text API integration
- Pre-generated timestamp data from audio processing
- WebVTT or similar caption format support

### Styling
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Custom Animations**: Smooth fade-in and slide-in effects
- **Color System**: Uses CSS custom properties for theming

## Accessibility Notes

### For Hearing-Impaired Users
- Full text transcription of audio content
- Visual playback indicators
- No reliance on audio-only information

### For International Students
- Multi-language caption support
- Clear, readable typography
- Cultural considerations in translation

### For Screen Reader Users
- Semantic HTML structure
- ARIA labels and live regions
- Keyboard-accessible controls

## Future Enhancements

1. **Real-time Speech Recognition**: Integrate with Web Speech API or cloud services
2. **More Languages**: Expand translation support
3. **Caption Download**: Allow students to download transcripts
4. **Playback Speed Control**: Adjust audio speed for different learning preferences
5. **Timestamp Navigation**: Click on captions to jump to specific audio sections
6. **Custom Styling**: User-configurable caption appearance (font size, colors)
7. **Offline Support**: Cache captions for offline access

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- React 19.1.0
- Next.js 15.5.3
- TailwindCSS 4
- Radix UI (Select component)
- Lucide React (icons)

## Viewing the Demo

Navigate to `/feedback-demo` in your application to see the interface in action.

```bash
npm run dev
# Visit http://localhost:3000/feedback-demo
```

## License

Part of the AI-Assisted Grading Platform project.
