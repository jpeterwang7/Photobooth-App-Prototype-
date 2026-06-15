import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Captures a React Native View ref as a PNG and shares it.
 * - Web:    Web Share API with file (Chrome Android / Safari iOS) → download fallback
 * - Native: expo-sharing share sheet
 */
export async function shareCollage(
  viewRef: RefObject<View>,
  name: string,
): Promise<void> {
  const slug = name.replace(/\s+/g, '-');

  // Capture the view as a PNG data URI / local file URI
  const uri = await captureRef(viewRef as any, {
    format: 'png',
    quality: 1,
    result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
  });

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const file = new File([blob], `${slug}.png`, { type: 'image/png' });

    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) {
      // Native share sheet (mobile browsers) — user can pick Instagram, etc.
      await nav.share({
        files: [file],
        title: name,
        text: `Check out my photo strip: ${name}`,
      });
    } else {
      // Desktop fallback: trigger a PNG download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } else {
    // React Native (iOS / Android)
    const Sharing = await import('expo-sharing');
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share ${name}`,
        UTI: 'public.png',
      });
    }
  }
}
