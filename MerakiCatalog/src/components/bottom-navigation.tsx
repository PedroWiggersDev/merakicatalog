import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { icons } from '@/constants/icons';
import { colors } from '@/constants/theme';
import { useConnectivity } from '@/components/app-shell-context';

type Tab = 'home' | 'catalog' | 'contact';

const items: { key: Tab; label: string; icon: keyof typeof icons; href: Href }[] = [
  { key: 'home', label: 'Início', icon: 'home', href: '/' },
  { key: 'catalog', label: 'Catálogo', icon: 'products', href: '/catalog' },
  { key: 'contact', label: 'Contato', icon: 'contact', href: '/contact' },
];

export function BottomNavigation({ active }: { active: Tab }) {
  const { checkConnection } = useConnectivity();
  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              void checkConnection().then((connected) => {
                if (connected) router.replace(item.href);
              });
            }}
            style={styles.item}
          >
            <Image source={icons[item.icon]} style={[styles.icon, !selected && styles.inactiveIcon]} />
            <Text style={[styles.label, selected && styles.selected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 78,
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { width: 25, height: 25 },
  inactiveIcon: { opacity: 0.52 },
  label: { color: colors.muted, fontSize: 11 },
  selected: { color: colors.blue, fontWeight: '700' },
});
