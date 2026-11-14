import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { icons } from '@/constants/icons';
import { useCatalog } from '@/hooks/use-catalog';

export function CatalogDrawer({ onClose, onNavigate, checkConnection }: { onClose: () => void; onNavigate: () => void; checkConnection: () => Promise<boolean> }) {
  const { data } = useCatalog();

  function navigate(action: () => void) {
    void checkConnection().then((connected) => {
      onNavigate();
      if (connected) action();
    });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.heading}>
        <Text style={styles.title}>Menu</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar menu">
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <MenuLink icon="home" label="Início" onPress={() => navigate(() => router.replace('/'))} />
        <MenuLink icon="products" label="Catálogo" onPress={() => navigate(() => router.push('/catalog'))} />
        <Text style={styles.section}>CATEGORIAS</Text>
        {data?.categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => navigate(() => router.push({ pathname: '/catalog', params: { category: category.id } }))}
            style={styles.categoryLink}
          >
            <Image source={icons.categories} style={styles.linkIconImage} />
            <Text style={styles.categoryName}>{category.name}</Text>
            <Image source={icons.chevron} style={styles.arrow} />
          </Pressable>
        ))}
        <MenuLink icon="contact" label="Contato" onPress={() => navigate(() => router.push('/contact'))} />
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Entrega mais rápida do DF</Text>
          <Text style={styles.noteBody}>Consulte disponibilidade para sua região.</Text>
          <Text style={styles.phone}>{data?.contactPhone ?? 'Carregando telefone...'}</Text>
        </View>
        <Pressable onPress={() => navigate(() => router.push('/contact'))} style={styles.button}>
          <Text style={styles.buttonText}>Falar com a equipe</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuLink({ icon, label, onPress }: { icon: keyof typeof icons; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuLink}>
      <Image source={icons[icon]} style={styles.linkIconImage} />
      <Text style={styles.linkText}>{label}</Text>
      <Image source={icons.chevron} style={styles.arrow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  heading: { height: 54, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  close: { color: colors.text, fontSize: 30, lineHeight: 34 },
  menuLink: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 13 },
  linkIconImage: { width: 21, height: 21, marginHorizontal: 2 },
  linkText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  section: { marginTop: 20, marginBottom: 7, color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  categoryLink: { height: 37, paddingLeft: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryName: { color: colors.text, fontSize: 13 },
  arrow: { width: 14, height: 14 },
  note: { marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: colors.paleGreen },
  noteTitle: { color: colors.green, fontSize: 12, fontWeight: '800' },
  noteBody: { marginTop: 5, color: colors.green, fontSize: 11 },
  phone: { marginTop: 9, padding: 8, borderRadius: 13, backgroundColor: colors.white, color: colors.blue, fontSize: 11, fontWeight: '700' },
  button: { marginTop: 18, height: 50, borderRadius: 15, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
