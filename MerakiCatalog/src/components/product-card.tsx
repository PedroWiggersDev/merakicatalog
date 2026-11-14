import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import type { Product } from '@/types/catalog';
import { ProductArtwork } from '@/components/product-artwork';
import { icons } from '@/constants/icons';
import { getImageUrl } from '@/services/catalog-api';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(280)}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {product.imageUrl ? (
          <Image source={{ uri: getImageUrl(product.imageUrl) }} style={styles.productImage} resizeMode="cover" />
        ) : <ProductArtwork compact />}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{product.model}{product.specifications[0] ? ` · ${product.specifications[0].value}` : ''}</Text>
        <View style={styles.details}>
          <Text style={styles.detailsText}>Ver detalhes</Text>
          <Image source={icons.chevron} style={styles.arrow} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  productImage: { width: '100%', height: 96, borderRadius: 13, backgroundColor: '#F7FAFC' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  name: { marginTop: 9, color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 11 },
  details: { marginTop: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailsText: { color: colors.blue, fontSize: 11, fontWeight: '700' },
  arrow: { width: 12, height: 12 },
});
