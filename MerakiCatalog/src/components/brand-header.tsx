import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useOpenMenu } from '@/components/app-shell-context';
import { icons } from '@/constants/icons';
import { colors } from '@/constants/theme';

export function BrandHeader() {
  const openMenu = useOpenMenu();

  return (
    <View style={styles.header}>
      <Image
        source={require('../../assets/brand/meraki-positive.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Meráki Refrigeração Automotiva"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        onPress={openMenu}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <Image source={icons.menu} style={styles.menuIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 78,
    paddingHorizontal: 20,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 108, height: 52 },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0A527D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  menuIcon: { width: 25, height: 25 },
  pressed: { opacity: 0.75 },
});
