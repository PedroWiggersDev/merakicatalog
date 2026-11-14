import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoadingState } from '@/components/loading-state';
import { RequestError } from '@/components/request-error';
import { Screen } from '@/components/screen';
import { colors } from '@/constants/theme';
import { getCatalog, submitContactMessage } from '@/services/catalog-api';
import { useConnectivity } from '@/components/app-shell-context';

export default function ContactScreen() {
  const { reportOffline } = useConnectivity();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [request, setRequest] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loadPhone = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const catalog = await getCatalog();
      setPhone(catalog.contactPhone);
      setError(null);
    } catch (requestError) {
      reportOffline();
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o contato.');
    } finally {
      setLoading(false);
    }
  }, [reportOffline]);

  useEffect(() => {
    let active = true;
    getCatalog()
      .then((catalog) => { if (active) setPhone(catalog.contactPhone); })
      .catch((requestError: unknown) => {
        if (active) {
          reportOffline();
          setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o contato.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportOffline]);

  const submit = async () => {
    if (!name.trim() || !customerPhone.trim() || !request.trim()) {
      setError('Preencha seu nome, telefone e o produto que procura.');
      return;
    }
    setSending(true);
    setError(null);
    setSent(false);
    try {
      await submitContactMessage({ name, phone: customerPhone, message: request });
      setName('');
      setCustomerPhone('');
      setRequest('');
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar sua mensagem.');
    } finally {
      setSending(false);
    }
  };

  const callPhone = async () => {
    try {
      await Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    } catch {
      Alert.alert('Não foi possível iniciar a ligação', 'Você pode copiar o telefone e ligar diretamente.');
    }
  };

  return (
    <Screen>
      {loading ? <LoadingState label="Carregando contato..." /> : error && !phone ? <RequestError message={error} onRetry={() => void loadPhone(true)} /> : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Fale com a Meráki</Text>
          <Text style={styles.subtitle}>Nossa equipe ajuda você a encontrar a peça certa.</Text>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Atendimento em Brasília</Text>
            <Text style={styles.heroSub}>e região do Distrito Federal</Text>
            <Pressable style={styles.phoneButton} onPress={() => void callPhone()}>
              <Text style={styles.phoneIcon}>☏</Text><Text style={styles.phoneText}>{phone}</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>Como podemos ajudar?</Text>
          <Input label="Seu nome" value={name} onChangeText={setName} placeholder="Digite seu nome" />
          <Input label="Telefone" value={customerPhone} onChangeText={setCustomerPhone} placeholder="(61) 9xxxx-xxxx" keyboardType="phone-pad" />
          <Input label="O que você procura?" value={request} onChangeText={setRequest} placeholder="Ex.: compressor Sanden 7H15" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {sent ? <Text style={styles.success}>Mensagem enviada! Nossa equipe entrará em contato.</Text> : null}
          <Pressable style={styles.submit} onPress={() => void submit()} disabled={sending}><Text style={styles.submitText}>{sending ? 'Enviando...' : 'Enviar mensagem'}</Text></Pressable>
          <Text style={styles.deliveryTitle}>Entrega mais rápida do DF</Text>
          <Text style={styles.deliverySub}>Consulte disponibilidade e prazo com nossa equipe.</Text>
          <View style={styles.hours}><Text style={styles.hoursText}>Seg–Sex · Atendimento comercial</Text></View>
        </ScrollView>
      )}
    </Screen>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 12 },
  hero: { marginTop: 18, padding: 17, backgroundColor: colors.blue, borderRadius: 22 },
  heroTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  heroSub: { marginTop: 6, color: '#DBEEFA', fontSize: 12 },
  phoneButton: { height: 43, marginTop: 17, borderRadius: 13, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, alignSelf: 'flex-start', minWidth: 200 },
  phoneIcon: { color: colors.blue, fontSize: 20 },
  phoneText: { color: colors.blue, fontSize: 13, fontWeight: '700' },
  sectionTitle: { marginTop: 23, marginBottom: 6, color: colors.text, fontSize: 16, fontWeight: '700' },
  inputGroup: { marginTop: 9 },
  inputLabel: { marginBottom: 5, color: colors.text, fontSize: 11, fontWeight: '700' },
  input: { height: 48, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, fontSize: 13 },
  error: { marginTop: 10, color: '#B42318', fontSize: 12 },
  success: { marginTop: 10, color: colors.green, fontSize: 12, fontWeight: '700' },
  submit: { marginTop: 17, height: 50, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  deliveryTitle: { marginTop: 15, color: colors.text, fontSize: 14, fontWeight: '700' },
  deliverySub: { marginTop: 4, color: colors.muted, fontSize: 11 },
  hours: { marginTop: 12, borderRadius: 12, backgroundColor: colors.paleBlue, padding: 11 },
  hoursText: { color: colors.blue, fontSize: 11, fontWeight: '700' },
});
