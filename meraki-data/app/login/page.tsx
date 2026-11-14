import Image from 'next/image';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/login-form';
import { getAdminSession } from '@/lib/auth';

export const instant = false;

export default async function LoginPage() {
  if (await getAdminSession()) redirect('/admin');

  return (
    <main className="login-shell">
      <section className="login-card">
        <Image src="/brand/meraki-negative.png" alt="Meráki Refrigeração Automotiva" width={220} height={110} priority />
        <div className="login-copy">
          <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>Entre para gerenciar seu catálogo</h1>
          <p>Cadastre produtos, organize categorias e atualize o telefone exibido no aplicativo.</p>
        </div>
        <LoginForm />
        <p className="login-footnote">Acesso restrito à equipe Meráki.</p>
      </section>
    </main>
  );
}
