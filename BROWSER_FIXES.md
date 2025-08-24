# Browser API Safety Fixes Applied

## Summary
Fixed unsafe access to browser APIs (window, document, navigator) that can cause errors in SSR or testing environments.

## Files Fixed

### 1. `/src/components/ChatWindow.tsx`
- Added browser environment checks for `window.addEventListener/removeEventListener`
- Added checks for `document.addEventListener/removeEventListener` 
- Added checks for `window.open` and `newWindow.document.write`

### 2. `/src/components/ui/sidebar.tsx`
- Added browser environment checks for `window.addEventListener/removeEventListener`
- Added checks for `document.cookie` access

### 3. `/src/components/DebugPanel.tsx`
- Added checks for `navigator.userAgent`, `window.location` access

### 4. `/src/components/DiscordBotSetup.tsx`
- Added checks for `navigator.clipboard` and `window.open`

### 5. `/src/components/GroupChatWindow.tsx`
- Added browser environment checks for `document.addEventListener/removeEventListener`

### 6. `/src/components/CanvasDrawing.tsx`
- Added checks for `document.createElement`

### 7. `/src/components/ImageViewer.tsx`
- Added checks for `document.createElement`

### 8. `/src/components/SpeakingOverlay.tsx`
- Added checks for `window.AudioContext`

### 9. `/src/lib/image-service.ts`
- Added browser environment checks for `document.createElement` in all methods

### 10. `/src/lib/voice-service.ts`
- Added checks for `window.speechSynthesis`

### 11. `/src/hooks/use-theme.ts`
- Added checks for `document.documentElement`

### 12. `/src/hooks/use-mobile.ts`
- Added browser environment checks for `window.matchMedia` and `window.innerWidth`

### 13. `/src/test-voice-removal.tsx`
- Added checks for `document.styleSheets` (and fixed corrupted file)

## Pattern Applied
All browser API accesses now follow this pattern:

```typescript
// Before (unsafe)
window.addEventListener('event', handler);

// After (safe)
if (typeof window !== 'undefined') {
  window.addEventListener('event', handler);
}
```

This prevents the "window.addEventListener is not a function" error in server-side rendering or testing environments.