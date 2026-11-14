import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meráki Data | Gestão do catálogo',
  description: 'Gerencie categorias, produtos e o contato do catálogo Meráki.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
