import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function RequestError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Não foi possível carregar</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', gap: 10 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  message: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  button: { marginTop: 8, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.blue },
  buttonText: { color: colors.white, fontWeight: '700' },
});
