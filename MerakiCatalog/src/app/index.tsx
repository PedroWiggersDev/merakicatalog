import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LoadingState } from '@/components/loading-state';
import { RequestError } from '@/components/request-error';
import { Screen } from '@/components/screen';
import { SearchField } from '@/components/search-field';
import { colors } from '@/constants/theme';
import { icons } from '@/constants/icons';
import { getImageUrl } from '@/services/catalog-api';
import { useCatalog } from '@/hooks/use-catalog';

export default function HomeScreen() {
  const { data, loading, error, refresh } = useCatalog();
  const [search, setSearch] = useState('');
  const categories = useMemo(
    () => data?.categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [data?.categories, search],
  );
  const matchingProducts = useMemo(
    () => data?.products.filter((product) => `${product.name} ${product.model} ${product.categoryName}`.toLowerCase().includes(search.toLowerCase())).slice(0, 4) ?? [],
    [data?.products, search],
  );

  return (
    <Screen>
      {loading ? <LoadingState /> : error ? <RequestError message={error} onRetry={() => void refresh()} /> : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
            <View>
              <Text style={styles.heroTitle}>Peças certas para{'\n'}seu ar-condicionado.</Text>
              <Text style={styles.heroSubtitle}>Catálogo Meráki · Brasília e DF</Text>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Entrega mais rápida do DF</Text></View>
            </View>
            <View style={styles.monogram}><Text style={styles.monogramText}>M</Text></View>
          </Animated.View>

          <Text style={styles.heading}>Explore o catálogo</Text>
          <Text style={styles.description}>Encontre a categoria que você precisa</Text>
          <View style={styles.search}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Buscar produto ou categoria" />
          </View>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <Pressable onPress={() => router.push('/catalog')}><Text style={styles.seeAll}>Ver todas</Text></Pressable>
          </View>
          <View style={styles.categoryList}>
            {categories.map((category, index) => (
              <Animated.View key={category.id} entering={FadeInDown.delay(index * 45).duration(250)}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/catalog', params: { category: category.id } })}
                  style={styles.category}
                >
                  <View style={styles.categoryIcon}>
                    <Image
                      source={category.imageUrl ? { uri: getImageUrl(category.imageUrl) } : icons.categories}
                      style={[styles.categoryIconImage, category.imageUrl && styles.categoryPhoto]}
                      resizeMode={category.imageUrl ? 'cover' : 'contain'}
                    />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>{category.productCount} itens</Text>
                  </View>
                  <Image source={icons.chevron} style={styles.arrowIcon} />
                </Pressable>
              </Animated.View>
            ))}
            {categories.length === 0 ? <Text style={styles.empty}>Nenhuma categoria encontrada.</Text> : null}
          </View>
          {search.trim() ? (
            <View style={styles.searchResults}>
              <Text style={styles.sectionTitle}>Produtos encontrados</Text>
              {matchingProducts.map((product) => (
                <Pressable key={product.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })} style={styles.result}>
                  <View style={styles.resultIcon}><Image source={icons.products} style={styles.categoryIconImage} /></View>
                  <View style={styles.categoryText}><Text style={styles.categoryName}>{product.name}</Text><Text style={styles.categoryCount}>{product.model}</Text></View>
                  <Image source={icons.chevron} style={styles.arrowIcon} />
                </Pressable>
              ))}
              {matchingProducts.length === 0 ? <Text style={styles.empty}>Nenhum produto encontrado.</Text> : null}
            </View>
          ) : null}
          <View style={styles.delivery}><Text style={styles.deliveryCheck}>✓</Text><Text style={styles.deliveryText}>Entrega mais rápida do DF</Text></View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22 },
  hero: { minHeight: 150, borderRadius: 23, backgroundColor: colors.blue, padding: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: '800', lineHeight: 26 },
  heroSubtitle: { color: '#D8ECF9', fontSize: 12, marginTop: 8 },
  heroBadge: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginTop: 13, alignSelf: 'flex-start' },
  heroBadgeText: { color: colors.navy, fontSize: 10, fontWeight: '700' },
  monogram: { width: 68, height: 68, borderRadius: 38, backgroundColor: '#3E94D1', alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: '#2A85C7' },
  monogramText: { color: colors.white, fontSize: 28, fontWeight: '800' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 17 },
  description: { color: colors.muted, fontSize: 12, marginTop: 4 },
  search: { marginTop: 14 },
  sectionTitleRow: { marginTop: 17, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  seeAll: { color: colors.blue, fontWeight: '700', fontSize: 12 },
  categoryList: { gap: 9 },
  searchResults: { marginTop: 16, gap: 8 },
  result: { minHeight: 58, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center' },
  resultIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  category: { height: 62, paddingHorizontal: 11, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  categoryIconImage: { width: 24, height: 24 },
  categoryPhoto: { width: 40, height: 40, borderRadius: 13 },
  categoryText: { flex: 1, marginLeft: 12 },
  categoryName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  categoryCount: { color: colors.muted, fontSize: 10, marginTop: 3 },
  arrowIcon: { width: 12, height: 12, marginHorizontal: 5 },
  empty: { color: colors.muted, padding: 18, textAlign: 'center' },
  delivery: { marginTop: 15, borderRadius: 12, backgroundColor: colors.paleGreen, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryCheck: { color: colors.green, fontSize: 19, fontWeight: '700' },
  deliveryText: { color: colors.green, fontSize: 12, fontWeight: '700' },
});
