import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={styles.content}>{children}</View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: colors.background },
});
