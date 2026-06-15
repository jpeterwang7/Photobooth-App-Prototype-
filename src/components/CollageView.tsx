import React from 'react';
import { View, Image, Text } from 'react-native';
import { GridConfig, Template } from '../types';

const PHOTO_RATIO = 1.35;

type Props = {
  photos: string[];
  grid: GridConfig;
  template: Template;
  collageName: string;
  width: number;
};

export default function CollageView({ photos, grid, template, collageName, width }: Props) {
  const tid = template.id;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Per-template layout constants ──────────────────────────────────────────
  // Classic: thick white outer frame + NOMADS header, tight black gaps
  // Film:    dark side panels with sprocket holes, warm footer
  // Neon:    colored per-photo borders, glowing header
  // Ivory:   cream background, polaroid white space under each photo
  // Minimal: edge-to-edge, zero decoration

  const outerBorder = tid === 'classic' ? 3 : 0;
  const filmSideW   = tid === 'film'    ? 12 : 0;
  const pad = tid === 'classic' ? 5
            : tid === 'ivory'   ? 8
            : tid === 'sky'     ? 6
            : tid === 'film'    ? 4
            : 0;
  const photoGap = tid === 'minimal' ? 0
                 : tid === 'film'    ? 2
                 : tid === 'ivory'   ? 0
                 : tid === 'classic' ? 2
                 : 2;
  const ivoryCapH = tid === 'ivory' ? 12 : 0;
  const headerH   = tid === 'classic' ? 20
                  : tid === 'film'    ? 10
                  : tid === 'sky'     ? 16
                  : 0;
  const footerH = tid === 'classic' ? 24
                : tid === 'film'    ? 18
                : tid === 'sky'     ? 20
                : tid === 'ivory'   ? 18
                : 0;

  // Photo cell dimensions
  const innerW = width - outerBorder * 2 - pad * 2 - filmSideW * 2;
  const cellW  = (innerW - photoGap * (grid.columns - 1)) / grid.columns;
  const cellH  = cellW * PHOTO_RATIO;

  // Approximate total height for film hole count
  const approxH =
    pad * 2 + headerH + (cellH + ivoryCapH) * grid.rows +
    photoGap * (grid.rows - 1) + footerH;
  const holeCount = Math.max(4, Math.floor(approxH / 22));

  return (
    <View style={{
      width,
      backgroundColor: template.backgroundColor,
      overflow: 'hidden',
      borderWidth: outerBorder,
      borderColor: '#FFFFFF',
    }}>

      {/* ── Film side panels (absolutely positioned, stretch full height) ── */}
      {tid === 'film' && (['left', 'right'] as const).map(side => (
        <View key={side} style={{
          position: 'absolute',
          [side]: 0,
          top: 0,
          bottom: 0,
          width: filmSideW,
          backgroundColor: '#1C1C1C',   // noticeably lighter than strip bg
          alignItems: 'center',
          paddingVertical: 8,
          gap: 7,
        }}>
          {Array.from({ length: holeCount }).map((_, i) => (
            <View key={i} style={{
              width: 7,
              height: 9,
              borderRadius: 2,
              backgroundColor: '#000',
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.25)',
            }} />
          ))}
        </View>
      ))}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <View style={{ margin: pad, marginHorizontal: pad + filmSideW }}>

        {/* Strip header */}
        {headerH > 0 && (
          <View style={{ height: headerH, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            {tid === 'classic' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: '#FFF' }} />
                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '700', letterSpacing: 4 }}>NOMADS</Text>
                <View style={{ width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: '#FFF' }} />
              </View>
            )}
            {tid === 'film' && (
              <Text style={{ color: '#C8A87A', fontSize: 6, fontWeight: '600', letterSpacing: 2.5 }}>
                NOMADS 400TX
              </Text>
            )}
            {tid === 'sky' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 12, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                <Text style={{ color: '#3A7A9B', fontSize: 7, fontWeight: '700', letterSpacing: 3 }}>NOMADS</Text>
                <View style={{ width: 12, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' }} />
              </View>
            )}
          </View>
        )}

        {/* Photo rows */}
        <View style={{ gap: photoGap }}>
          {Array.from({ length: grid.rows }).map((_, row) => (
            <View key={row} style={{ flexDirection: 'row', gap: photoGap }}>
              {Array.from({ length: grid.columns }).map((_, col) => {
                const photo = photos[row * grid.columns + col];
                return (
                  <View key={col} style={{ width: cellW }}>
                    {/* Photo frame */}
                    <View style={[
                      { width: cellW, height: cellH, overflow: 'hidden', backgroundColor: '#111' },
                      template.cornerRadius > 0 && { borderRadius: template.cornerRadius },
                    ]}>
                      {photo ? (
                        <Image
                          source={{ uri: photo }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ flex: 1, backgroundColor: '#111' }} />
                      )}
                    </View>
                    {/* Ivory polaroid caption strip */}
                    {tid === 'ivory' && (
                      <View style={{
                        height: ivoryCapH,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: 5,
                      }}>
                        <View style={{ width: 12, height: 1, backgroundColor: '#DDD', borderRadius: 1 }} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Strip footer */}
        {footerH > 0 && (
          <View style={{ height: footerH, alignItems: 'center', justifyContent: 'center', marginTop: 2, gap: 3 }}>
            {template.showName && (
              <Text
                style={{ color: template.textColor, fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}
                numberOfLines={1}
              >
                {collageName}
              </Text>
            )}
            {template.showDate && (
              <Text style={{ color: template.accentColor, fontSize: 7, letterSpacing: 0.8 }}>
                {today}
              </Text>
            )}
            {tid === 'film' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 12, height: 0.5, backgroundColor: '#5A4A36' }} />
                <Text style={{ color: '#8A7A6A', fontSize: 5.5, letterSpacing: 2, fontWeight: '600' }}>NOMADS</Text>
                <View style={{ width: 12, height: 0.5, backgroundColor: '#5A4A36' }} />
              </View>
            )}
            {tid === 'sky' && (
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end' }}>
                <View style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)' }} />
                <View style={{ width: 10, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.55)' }} />
                <View style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.75)' }} />
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
