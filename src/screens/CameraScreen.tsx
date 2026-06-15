import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Camera'>;
  route: RouteProp<RootStackParamList, 'Camera'>;
};

type Phase = 'permission' | 'ready' | 'countdown' | 'flash' | 'done';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Mirrors a photo URI horizontally using an off-screen canvas.
 * Only called on web for front-facing captures — the raw video frame is
 * unmirrored, which looks "flipped" compared to the mirrored preview.
 */
function flipHorizontal(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(uri); return; }
      ctx.translate(img.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(uri); // fall back to original on error
    img.src = uri;
  });
}

export default function CameraScreen({ navigation, route }: Props) {
  const { gridId, templateId, collageName, totalPhotos, gridPhotoCount } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [phase, setPhase] = useState<Phase>('ready');
  const [readyCount, setReadyCount] = useState(3);
  const [countdown, setCountdown] = useState(10);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  // Actual rendered size — fixes Dimensions returning browser window size on web
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });

  const cameraRef = useRef<CameraView>(null);
  const capturedPhotosRef = useRef<string[]>([]);
  const sessionCancelled = useRef(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      sessionCancelled.current = true;
    };
  }, []);

  const triggerFlash = useCallback(() => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [flashAnim]);

  const animateCountdown = useCallback(() => {
    countdownScale.setValue(1.4);
    Animated.spring(countdownScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();
  }, [countdownScale]);

  const startSession = useCallback(async () => {
    // "Get Ready" countdown
    setPhase('ready');
    for (let i = 3; i >= 1; i--) {
      if (sessionCancelled.current) return;
      setReadyCount(i);
      animateCountdown();
      await delay(1000);
    }

    // Photo loop
    for (let photoIdx = 0; photoIdx < totalPhotos; photoIdx++) {
      if (sessionCancelled.current) return;
      setPhase('countdown');
      setCurrentPhotoIndex(photoIdx);

      for (let c = 10; c >= 1; c--) {
        if (sessionCancelled.current) return;
        setCountdown(c);
        animateCountdown();
        await delay(1000);
      }

      if (sessionCancelled.current) return;

      // Flash & capture
      setPhase('flash');
      triggerFlash();

      try {
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.85,
          skipProcessing: true,
        });
        if (photo?.uri) {
          // On web the front camera captures an unmirrored frame while the
          // preview is shown mirrored — flip it so the result matches what
          // the user saw in the preview.
          const uri = (Platform.OS === 'web' && facing === 'front')
            ? await flipHorizontal(photo.uri)
            : photo.uri;
          capturedPhotosRef.current.push(uri);
          setCapturedCount(prev => prev + 1);
        }
      } catch (e) {
        // Generate placeholder color if camera fails
        capturedPhotosRef.current.push('');
      }

      if (photoIdx < totalPhotos - 1) {
        await delay(1200);
      }
    }

    if (!sessionCancelled.current) {
      setPhase('done');
      await delay(300);
      navigation.navigate('Selection', {
        photos: capturedPhotosRef.current,
        gridId,
        templateId,
        collageName,
        requiredCount: gridPhotoCount,
      });
    }
  }, [totalPhotos, gridId, templateId, collageName, gridPhotoCount, navigation, triggerFlash, animateCountdown]);

  useEffect(() => {
    if (cameraReady && permission?.granted) {
      const t = setTimeout(() => startSession(), 400);
      return () => clearTimeout(t);
    }
  }, [cameraReady, permission?.granted, startSession]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permBox}>
          <Ionicons name="camera-outline" size={48} color="#FFFFFF" />
          <Text style={styles.permTitle}>Camera Access</Text>
          <Text style={styles.permSub}>BOOTH needs your camera to take photos</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getCountdownColor = (n: number) => {
    if (n <= 3) return '#FF3B30';
    if (n <= 6) return '#FF9500';
    return '#FFFFFF';
  };

  // Crop frame computed from actual rendered size (not window size)
  const { w: VW, h: VH } = viewSize;
  const CROP_W = VW * 0.82;
  const CROP_H = CROP_W * 1.35;
  const CROP_X = (VW - CROP_W) / 2;
  const CROP_Y = (VH - CROP_H) / 2;
  const showCrop = VW > 0 && CROP_H < VH;

  return (
    <View
      style={styles.container}
      onLayout={e => setViewSize({
        w: e.nativeEvent.layout.width,
        h: e.nativeEvent.layout.height,
      })}
    >
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Crop mask — four dark panels surrounding the frame */}
      {showCrop && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.mask, { top: 0, left: 0, right: 0, height: CROP_Y }]} />
          <View style={[styles.mask, { bottom: 0, left: 0, right: 0, height: CROP_Y }]} />
          <View style={[styles.mask, { top: CROP_Y, left: 0, width: CROP_X, height: CROP_H }]} />
          <View style={[styles.mask, { top: CROP_Y, right: 0, width: CROP_X, height: CROP_H }]} />
          {[
            { top: CROP_Y, left: CROP_X, ...styles.cornerTL },
            { top: CROP_Y, right: CROP_X, ...styles.cornerTR },
            { bottom: CROP_Y, left: CROP_X, ...styles.cornerBL },
            { bottom: CROP_Y, right: CROP_X, ...styles.cornerBR },
          ].map((s, i) => (
            <View key={i} style={[styles.corner, s]} />
          ))}
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => { sessionCancelled.current = true; navigation.goBack(); }}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.sessionInfo}>
          <View style={styles.recDot} />
          <Text style={styles.sessionLabel}>{collageName}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
        >
          <Ionicons name="camera-reverse-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Countdown — full-screen centered so it's always visible */}
      <View style={styles.centerOverlay} pointerEvents="none">
        {phase === 'ready' && (
          <View style={styles.readyBox}>
            <Animated.Text
              style={[styles.readyNumber, { transform: [{ scale: countdownScale }] }]}
            >
              {readyCount}
            </Animated.Text>
            <Text style={styles.readyLabel}>GET READY</Text>
          </View>
        )}
        {phase === 'countdown' && (
          <Animated.Text
            style={[
              styles.countdownNumber,
              { color: getCountdownColor(countdown), transform: [{ scale: countdownScale }] },
            ]}
          >
            {countdown}
          </Animated.Text>
        )}
        {phase === 'flash' && (
          <Text style={styles.smileText}>SMILE</Text>
        )}
      </View>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flash, { opacity: flashAnim }]}
        pointerEvents="none"
      />

      {/* Bottom tracker */}
      <View style={styles.bottomBar}>
        <Text style={styles.photoCounter}>
          {phase === 'ready' ? 'Loading…' : `Photo ${Math.min(currentPhotoIndex + 1, totalPhotos)} of ${totalPhotos}`}
        </Text>
        <View style={styles.dots}>
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < capturedCount && styles.dotDone,
                i === currentPhotoIndex && phase === 'countdown' && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.hintText}>
          {phase === 'countdown' ? `${gridPhotoCount} will be used` : 'Stay still'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Crop mask panels
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // Corner bracket shared
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  cornerTL: { borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { borderLeftWidth: 0, borderTopWidth: 0 },
  // Full-screen centered overlay for countdown (always visible)
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyBox: {
    alignItems: 'center',
    gap: 10,
  },
  readyNumber: {
    fontSize: 100,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  readyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 5,
  },
  countdownNumber: {
    fontSize: 130,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  smileText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  photoCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  dotDone: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ scale: 1.3 }],
  },
  hintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },

  // Permission
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  permTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  permSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  backLink: { paddingVertical: 10 },
  backLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});
