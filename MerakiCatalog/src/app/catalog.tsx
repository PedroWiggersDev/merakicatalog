import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { useOpenMenu } from '@/components/app-shell-context';
import { icons } from '@/constants/icons';
import { LoadingState } from '@/components/loading-state';
import { ProductCard } from '@/components/product-card';
import { RequestError } from '@/components/request-error';
import { Screen } from '@/components/screen';
import { SearchField } from '@/components/search-field';
import { colors } from '@/constants/theme';
import { useCatalog } from '@/hooks/use-catalog';

export default function CatalogScreen() {
  const openMenu = useOpenMenu();
  const { data, loading, refreshing, error, refresh } = useCatalog();
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState('');
  const selectedCategory = params.category ?? 'all';

  const products = useMemo(() => data?.products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const searchText = `${product.name} ${product.model} ${product.categoryName}`.toLowerCase();
    return matchesCategory && searchText.includes(search.toLowerCase());
  }) ?? [], [data?.products, search, selectedCategory]);

  return (
    <Screen>
      {loading ? <LoadingState /> : error ? <RequestError message={error} onRetry={() => void refresh()} /> : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(true)} tintColor={colors.blue} />}
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>Catálogo</Text>
              <Text style={styles.subtitle}>Peças para refrigeração automotiva</Text>
              <View style={styles.search}><SearchField value={search} onChangeText={setSearch} placeholder="Buscar no catálogo" /></View>
              <View style={styles.filters}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={[{ id: 'all', name: 'Todas' }, ...(data?.categories ?? [])]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.chips}
                  renderItem={({ item }) => {
                    const selected = item.id === selectedCategory;
                    return (
                      <Pressable onPress={() => router.replace({ pathname: '/catalog', params: { category: item.id } })} style={[styles.chip, selected && styles.activeChip]}>
                        <Text style={[styles.chipText, selected && styles.activeChipText]}>{item.name}</Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
              <View style={styles.countRow}>
                <Text style={styles.count}>{products.length} {products.length === 1 ? 'produto' : 'produtos'}</Text>
                <Pressable onPress={openMenu} style={styles.filterButton}><Image source={icons.filter} style={styles.filterIcon} /><Text style={styles.filterText}>Filtrar</Text></Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => <View style={styles.card}><ProductCard product={item} index={index} /></View>}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto encontrado.</Text>}
          ListFooterComponent={
            <Pressable onPress={() => router.push('/contact')} style={styles.helpBanner}>
              <Text style={styles.helpIcon}>☏</Text><Text style={styles.helpText}>Precisa de ajuda? Fale com a Meráki</Text>
            </Pressable>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  search: { marginTop: 13 },
  filters: { marginTop: 12 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#E6F1F9', borderRadius: 12 },
  activeChip: { backgroundColor: colors.blue },
  chipText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  activeChipText: { color: colors.white },
  countRow: { marginTop: 8, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  filterButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterIcon: { width: 15, height: 15 },
  filterText: { color: colors.blue, fontSize: 11, fontWeight: '700' },
  row: { gap: 10, marginBottom: 10 },
  card: { flex: 1 },
  empty: { paddingVertical: 30, color: colors.muted, textAlign: 'center' },
  helpBanner: { marginTop: 5, height: 44, borderRadius: 13, backgroundColor: colors.navy, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', gap: 9 },
  helpIcon: { fontSize: 19, color: colors.white },
  helpText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
