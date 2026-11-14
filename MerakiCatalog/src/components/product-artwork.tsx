import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

export function ProductArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.stage, compact ? styles.compactStage : styles.largeStage]}>
      <View style={[styles.compressor, compact && styles.compactCompressor]}>
        <View style={[styles.body, compact && styles.compactBody]}>
          <View style={styles.ridge} />
          <View style={styles.ridge} />
          <View style={styles.ridge} />
          <View style={styles.ridge} />
        </View>
        <View style={[styles.disc, compact && styles.compactDisc]}>
          <View style={[styles.discCenter, compact && styles.compactDiscCenter]} />
        </View>
        <View style={[styles.connector, compact && styles.compactConnector]} />
        <View style={[styles.nozzle, compact && styles.compactNozzle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactStage: { height: 96, borderRadius: 13 },
  largeStage: { height: 205, borderRadius: 24, backgroundColor: colors.white },
  compressor: { width: 188, height: 82, position: 'relative', justifyContent: 'center' },
  compactCompressor: { transform: [{ scale: 0.64 }] },
  body: {
    position: 'absolute',
    right: 12,
    width: 134,
    height: 70,
    backgroundColor: '#A8BBC4',
    borderColor: '#627C89',
    borderWidth: 4,
    borderRadius: 18,
    justifyContent: 'space-evenly',
    paddingHorizontal: 25,
  },
  compactBody: { width: 134, height: 70 },
  ridge: { height: 3, backgroundColor: '#758D98', width: '100%' },
  disc: {
    position: 'absolute',
    left: 3,
    width: 58,
    height: 58,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#667F8B',
    backgroundColor: '#C4D3D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDisc: { width: 58, height: 58 },
  discCenter: {
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#647D88',
    backgroundColor: '#E7F0F3',
  },
  compactDiscCenter: { width: 28, height: 28 },
  connector: { position: 'absolute', left: 54, width: 8, height: 62, backgroundColor: '#748A94' },
  compactConnector: { height: 62 },
  nozzle: {
    position: 'absolute',
    right: 2,
    top: 5,
    width: 21,
    height: 15,
    backgroundColor: '#142C3B',
    transform: [{ rotate: '-35deg' }],
    borderTopWidth: 4,
    borderColor: '#718590',
  },
  compactNozzle: { width: 21, height: 15 },
});
