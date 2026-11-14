import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShellProvider } from '@/components/app-shell-context';
import { BottomNavigation } from '@/components/bottom-navigation';
import { BrandHeader } from '@/components/brand-header';
import { CatalogDrawer } from '@/components/catalog-drawer';
import { colors } from '@/constants/theme';
import { checkCatalogConnection } from '@/services/catalog-api';

export default function RootLayout() {
  const pathname = usePathname();
  const [menuVisible, setMenuVisible] = useState(false);
  const [connectivity, setConnectivity] = useState<'checking' | 'online' | 'offline'>('checking');
  const connectionRequest = useRef<Promise<boolean> | null>(null);
  const checkConnection = useCallback((): Promise<boolean> => {
    if (connectionRequest.current) return connectionRequest.current;
    const request = checkCatalogConnection()
      .then(() => {
        setConnectivity('online');
        return true;
      })
      .catch(() => {
        setConnectivity('offline');
        setMenuVisible(false);
        return false;
      })
      .finally(() => {
        connectionRequest.current = null;
      });
    connectionRequest.current = request;
    return request;
  }, []);
  const reportOffline = useCallback(() => {
    setConnectivity('offline');
    setMenuVisible(false);
  }, []);
  const retryConnection = useCallback(() => {
    setConnectivity('checking');
    void checkConnection();
  }, [checkConnection]);
  const shellValue = useMemo(() => ({
    openMenu: () => {
      void checkConnection().then((connected) => {
        if (connected) setMenuVisible(true);
      });
    },
    isOnline: connectivity === 'online',
    retryConnection,
    reportOffline,
    checkConnection,
  }), [checkConnection, connectivity, reportOffline, retryConnection]);

  useEffect(() => {
    const initialCheck = setTimeout(() => void checkConnection(), 0);
    const interval = setInterval(() => void checkConnection(), 2000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkConnection();
    });
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkConnection]);

  const activeTab = pathname.startsWith('/catalog') || pathname.startsWith('/product')
    ? 'catalog'
    : pathname.startsWith('/contact')
      ? 'contact'
      : 'home';

  return (
    <AppShellProvider value={shellValue}>
      <StatusBar style={connectivity === 'online' ? 'light' : 'dark'} />
      {connectivity !== 'online' ? (
        <SafeAreaView style={styles.offline}>
          <View style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>{connectivity === 'checking' ? 'Conectando ao catálogo' : 'Sem conexão'}</Text>
            <Text style={styles.offlineMessage}>
              {connectivity === 'checking'
                ? 'Verificando a conexão com o catálogo Meráki...'
                : 'Conecte-se à internet para navegar pelo catálogo.'}
            </Text>
            {connectivity === 'offline' ? (
              <Pressable onPress={retryConnection} style={styles.retryButton}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      ) : (
        <>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <BrandHeader />
            <View style={styles.content}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  contentStyle: { backgroundColor: colors.background },
                }}
              />
            </View>
            <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
              <BottomNavigation active={activeTab} />
            </SafeAreaView>
          </SafeAreaView>
          <Modal
            visible={menuVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={styles.drawerOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                style={StyleSheet.absoluteFill}
                onPress={() => setMenuVisible(false)}
              />
              <Animated.View entering={SlideInLeft.duration(220)} style={styles.drawer}>
                <CatalogDrawer onNavigate={() => setMenuVisible(false)} onClose={() => setMenuVisible(false)} checkConnection={checkConnection} />
              </Animated.View>
            </View>
          </Modal>
        </>
      )}
    </AppShellProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.navy },
  content: { flex: 1, backgroundColor: colors.background },
  bottomArea: { backgroundColor: colors.white },
  drawerOverlay: { flex: 1, backgroundColor: '#001C2BCC', flexDirection: 'row' },
  drawer: { width: '84%', maxWidth: 340, height: '100%', backgroundColor: colors.background },
  offline: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  offlineCard: { alignItems: 'center', padding: 24, borderRadius: 20, backgroundColor: colors.white },
  offlineTitle: { color: colors.text, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  offlineMessage: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.blue },
  retryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
