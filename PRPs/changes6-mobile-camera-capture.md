# Plan: Mobile Camera Capture for Barcode Scanning

## Overview
Add native camera capture capability to the BarcodeScanner component so mobile users can click a button, be directed to their device's camera app, take a photo, and have it automatically processed for barcode detection.

## Approach: Native Camera Capture (Option B)
Uses the HTML `capture="environment"` attribute to open the rear camera directly on mobile devices.

## Benefits
- Simple 1-line change to existing code
- Uses native camera app (familiar UX for users)
- No browser permission prompts
- Works on all mobile browsers (iOS Safari, Chrome, etc.)
- Photo is automatically returned to the app for processing

## File to Modify
**`src/components/BarcodeScanner.tsx`**

## Change Required

### Current Code (line ~224-228):
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,application/pdf"
  onChange={handleImageUpload}
  className="hidden"
  disabled={scanning}
/>
```

### Updated Code:
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,application/pdf"
  capture="environment"
  onChange={handleImageUpload}
  className="hidden"
  disabled={scanning}
/>
```

## How It Works
1. User clicks "Upload Barcode Image" button
2. On mobile: Opens camera app directly (rear camera)
3. On desktop: Opens file picker as before
4. User takes photo / selects file
5. Photo is automatically passed to `handleImageUpload()`
6. Existing barcode detection logic processes the image
7. If barcode found, user is routed to the appropriate page

## User Flow (Mobile)
```
Click "Scan Barcode" button
       ↓
Camera app opens (rear camera)
       ↓
User takes photo of barcode
       ↓
Photo auto-submitted to app
       ↓
Barcode detected & processed
       ↓
Redirect to /inspection/[barcode] or /qc/[barcode]
```

## Browser Support
| Browser | Support |
|---------|---------|
| iOS Safari | Yes (opens Camera app) |
| Chrome Android | Yes (opens Camera app) |
| Desktop browsers | Ignored (opens file picker) |

## Optional Enhancement: Update Button Text
Could update the button text to be clearer for mobile users:

```tsx
<span className="text-sm text-gray-600">
  {isMobile ? 'Tap to take photo of barcode' : 'Click to upload barcode image'}
</span>
```

Where `isMobile` is detected via:
```tsx
const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
```

## Testing Checklist
- [ ] Test on iPhone Safari - camera opens
- [ ] Test on Android Chrome - camera opens
- [ ] Test on desktop - file picker opens (unchanged behavior)
- [ ] Verify barcode detection works with camera photos
- [ ] Test in both Inspection and QC workflows
