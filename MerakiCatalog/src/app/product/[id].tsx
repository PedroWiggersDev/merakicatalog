import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ProductArtwork } from '@/components/product-artwork';
import { RequestError } from '@/components/request-error';
import { Screen } from '@/components/screen';
import { colors } from '@/constants/theme';
import { getImageUrl, getProduct } from '@/services/catalog-api';
import { useConnectivity } from '@/components/app-shell-context';
import type { ProductResponse } from '@/types/catalog';

type ProductState = {
  id: string;
  loading: boolean;
  result: ProductResponse | null;
  error: string | null;
};

export default function ProductScreen() {
  const { reportOffline } = useConnectivity();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<ProductState>(() => ({
    id,
    loading: true,
    result: null,
    error: null,
  }));

  useEffect(() => {
    let active = true;
    getProduct(id)
      .then((result) => {
        if (active) setState({ id, loading: false, result, error: null });
      })
      .catch((requestError: unknown) => {
        if (active) {
          reportOffline();
          setState({
            id,
            loading: false,
            result: null,
            error: requestError instanceof Error ? requestError.message : 'Não foi possível carregar o produto.',
          });
        }
      })
    return () => { active = false; };
  }, [id, reportOffline]);

  const loading = state.id !== id || state.loading;
  const result = state.id === id ? state.result : null;
  const error = state.id === id ? state.error : null;

  const openWhatsApp = async () => {
    if (!result) return;
    const phone = result.contactPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Tenho interesse em ${result.product.name} (${result.product.model}).`);
    try {
      await Linking.openURL(`https://wa.me/${phone}?text=${message}`);
    } catch {
      Alert.alert('Não foi possível abrir o WhatsApp', 'Tente novamente ou entre em contato pelo telefone informado.');
    }
  };

  return (
    <Screen>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /><Text style={styles.muted}>Carregando produto...</Text></View> : error || !result ? (
        <RequestError message={error ?? 'Produto não encontrado.'} onRetry={() => {
          setState({ id, loading: true, result: null, error: null });
          void getProduct(id)
            .then((nextResult) => setState({ id, loading: false, result: nextResult, error: null }))
            .catch((requestError: unknown) => {
              reportOffline();
              setState({
                id,
                loading: false,
                result: null,
                error: requestError instanceof Error ? requestError.message : 'Falha ao carregar o produto.',
              });
            });
        }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.category}>{result.product.categoryName}</Text>
          <Text style={styles.title}>{result.product.name}</Text>
          <Text style={styles.subtitle}>{result.product.model}</Text>
          <View style={styles.artwork}>
            {result.product.imageUrl
              ? <Image source={{ uri: getImageUrl(result.product.imageUrl) }} style={styles.productImage} resizeMode="contain" />
              : <ProductArtwork />}
          </View>
          <View style={styles.available}><Text style={styles.availableDot}>●</Text><Text style={styles.availableText}>Disponível sob consulta</Text></View>
          <Text style={styles.sectionTitle}>Sobre o produto</Text>
          <Text style={styles.description}>{result.product.description}</Text>
          <View style={styles.specs}>
            <Text style={styles.specsTitle}>Especificações</Text>
            <View style={styles.specRow}><Text style={styles.specLabel}>Modelo</Text><Text style={styles.specValue}>{result.product.model}</Text></View>
            {result.product.specifications.map((specification) => (
              <View style={styles.specRow} key={specification.property}>
                <Text style={styles.specLabel}>{specification.property}</Text>
                <Text style={styles.specValue}>{specification.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.delivery}><Text style={styles.availableDot}>✓</Text><View><Text style={styles.availableText}>Entrega mais rápida do DF</Text><Text style={styles.deliverySub}>Consulte prazo para sua região</Text></View></View>
          <Pressable onPress={openWhatsApp} style={styles.contactButton}><Text style={styles.contactIcon}>☏</Text><View><Text style={styles.contactText}>Consultar pelo WhatsApp</Text><Text style={styles.contactSub}>{result.contactPhone}</Text></View></Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 18, paddingBottom: 28 },
  category: { color: colors.blue, fontSize: 12, fontWeight: '700' },
  title: { marginTop: 2, color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 13 },
  artwork: { marginTop: 16, borderRadius: 23, borderWidth: 1, borderColor: colors.border },
  productImage: { width: '100%', height: 205, borderRadius: 24, backgroundColor: colors.white },
  available: { marginTop: -14, marginLeft: 12, alignSelf: 'flex-start', borderRadius: 15, backgroundColor: colors.paleGreen, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 6, alignItems: 'center' },
  availableDot: { color: colors.green, fontSize: 12, fontWeight: '700' },
  availableText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  sectionTitle: { marginTop: 24, color: colors.text, fontSize: 16, fontWeight: '700' },
  description: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  specs: { marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, backgroundColor: colors.white },
  specsTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  specRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  specLabel: { color: colors.muted, fontSize: 11 },
  specValue: { color: colors.text, fontSize: 11, fontWeight: '700', marginRight: 10 },
  delivery: { marginTop: 13, borderRadius: 14, backgroundColor: colors.paleGreen, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliverySub: { marginTop: 3, color: colors.green, fontSize: 10 },
  contactButton: { marginTop: 13, borderRadius: 15, backgroundColor: colors.blue, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { color: colors.white, fontSize: 25 },
  contactText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  contactSub: { marginTop: 3, color: '#D9EDFA', fontSize: 11 },
  muted: { color: colors.muted },
});
