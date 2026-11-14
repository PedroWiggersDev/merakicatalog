import { createContext, useContext, type PropsWithChildren } from 'react';

type AppShellValue = {
  openMenu: () => void;
  isOnline: boolean;
  retryConnection: () => void;
  reportOffline: () => void;
  checkConnection: () => Promise<boolean>;
};

const AppShellContext = createContext<AppShellValue | null>(null);

export function AppShellProvider({ children, value }: PropsWithChildren<{ value: AppShellValue }>) {
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useOpenMenu() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error('useOpenMenu must be used within AppShellProvider.');
  return context.openMenu;
}

export function useConnectivity() {
  const context = useContext(AppShellContext);
  if (!context) throw new Error('useConnectivity must be used within AppShellProvider.');
  return context;
}
