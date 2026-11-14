'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import type { Category, ContactMessage, Product, ProductInput, ProductSpecification } from '@/lib/types';

type Tab = 'products' | 'categories' | 'messages' | 'settings';
type Notice = { kind: 'success' | 'error'; text: string };
type Settings = { contactPhone: string };

async function apiRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'A solicitação não foi concluída.';
    throw new Error(message);
  }
  return result as T;
}

async function imageUrlFromForm(form: FormData, currentImageUrl: string | null): Promise<string | null> {
  if (form.get('removeImage') === 'on') return null;
  const file = form.get('image');
  if (!(file instanceof File) || file.size === 0) return currentImageUrl;

  const upload = new FormData();
  upload.set('image', file);
  const response = await fetch('/api/admin/uploads', { method: 'POST', body: upload });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'Não foi possível enviar a imagem.';
    throw new Error(message);
  }
  if (typeof result !== 'object' || result === null || !('imageUrl' in result) || typeof result.imageUrl !== 'string') {
    throw new Error('O servidor não retornou o endereço da imagem enviada.');
  }
  return result.imageUrl;
}

function fetchAdminData() {
  return Promise.all([
    apiRequest<Category[]>('/api/admin/categories'),
    apiRequest<Product[]>('/api/admin/products'),
    apiRequest<ContactMessage[]>('/api/admin/messages'),
    apiRequest<Settings>('/api/admin/settings'),
  ]);
}

export function AdminWorkspace({ email }: { email: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [nextCategories, nextProducts, nextMessages, settings] = await fetchAdminData();
      setCategories(nextCategories);
      setProducts(nextProducts);
      setMessages(nextMessages);
      setContactPhone(settings.contactPhone);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminData()
      .then(([nextCategories, nextProducts, nextMessages, settings]) => {
        if (!active) return;
        setCategories(nextCategories);
        setProducts(nextProducts);
        setMessages(nextMessages);
        setContactPhone(settings.contactPhone);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os dados.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError('');
    await loadData();
  }, [loadData]);

  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);

  async function logout() {
    try {
      await apiRequest('/api/admin/logout', 'POST');
      router.replace('/login');
      router.refresh();
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível encerrar a sessão.' });
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>, editing?: Category): Promise<boolean> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const payload = {
        name: String(form.get('name') ?? ''),
        description: String(form.get('description') ?? ''),
        imageUrl: await imageUrlFromForm(form, editing?.imageUrl ?? null),
      };
      await apiRequest(editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', editing ? 'PATCH' : 'POST', payload);
      setNotice({ kind: 'success', text: editing ? 'Categoria atualizada.' : 'Categoria cadastrada.' });
      await loadData();
      return true;
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível salvar a categoria.' });
      return false;
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>, editing: Product | undefined, specifications: ProductSpecification[]): Promise<boolean> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const payload: ProductInput = {
        name: String(form.get('name') ?? ''),
        model: String(form.get('model') ?? ''),
        description: String(form.get('description') ?? ''),
        imageUrl: await imageUrlFromForm(form, editing?.imageUrl ?? null),
        specifications: specifications.filter(({ property, value }) => property.trim() || value.trim()),
        categoryId: String(form.get('categoryId') ?? ''),
      };
      await apiRequest(editing ? `/api/admin/products/${editing.id}` : '/api/admin/products', editing ? 'PATCH' : 'POST', payload);
      setNotice({ kind: 'success', text: editing ? 'Produto atualizado.' : 'Produto cadastrado.' });
      await loadData();
      return true;
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível salvar o produto.' });
      return false;
    }
  }

  async function remove(path: string, label: string) {
    if (!window.confirm(`Deseja remover ${label}?`)) return;
    try {
      await apiRequest(path, 'DELETE');
      setNotice({ kind: 'success', text: `${label} removido.` });
      await loadData();
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível remover.' });
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const settings = await apiRequest<Settings>('/api/admin/settings', 'PATCH', { contactPhone });
      setContactPhone(settings.contactPhone);
      setNotice({ kind: 'success', text: 'Telefone de contato atualizado.' });
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível atualizar o telefone.' });
    }
  }

  async function updateMessage(id: string, read: boolean) {
    try {
      await apiRequest(`/api/admin/messages/${id}`, 'PATCH', { read });
      await loadData();
    } catch (requestError) {
      setNotice({ kind: 'error', text: requestError instanceof Error ? requestError.message : 'Não foi possível atualizar a mensagem.' });
    }
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Image className="sidebar-logo" src="/brand/meraki-positive.png" alt="Meráki" width={180} height={72} priority />
        <span className="sidebar-caption">GESTÃO DO CATÁLOGO</span>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={tab === 'products' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('products')}><Image src="/icons/products.svg" alt="" width={20} height={20} unoptimized /> Produtos</button>
          <button className={tab === 'categories' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('categories')}><Image src="/icons/categories.svg" alt="" width={20} height={20} unoptimized /> Categorias</button>
          <button className={tab === 'messages' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('messages')}><Image src="/icons/messages.svg" alt="" width={20} height={20} unoptimized /> Mensagens{messages.filter((message) => !message.readAt).length > 0 ? ` (${messages.filter((message) => !message.readAt).length})` : ''}</button>
          <button className={tab === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('settings')}><Image src="/icons/settings.svg" alt="" width={20} height={20} unoptimized /> Configurações</button>
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Catálogo conectado</span>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div className="breadcrumbs">Meráki <span>/</span> {tabLabel(tab)}</div>
          <div className="user-area"><span className="user-avatar">{email.charAt(0).toUpperCase()}</span><span className="user-email">{email}</span><button className="logout-button" onClick={logout}>Sair</button></div>
        </header>
        <section className="page-content">
          <div className="page-heading">
            <div><span className="eyebrow">PAINEL DE CONTROLE</span><h1>{tabLabel(tab)}</h1><p>Gerencie as informações que aparecem no aplicativo Meráki Catalog.</p></div>
            <button className="secondary-button" onClick={() => void refreshData()} disabled={loading}>↻ Atualizar</button>
          </div>
          <div className="stats-grid">
            <StatCard label="Produtos ativos" value={activeProducts.length} detail="visíveis no aplicativo" icon="▦" />
            <StatCard label="Categorias" value={categories.length} detail="organizadas no catálogo" icon="◇" />
            <StatCard label="Contato do catálogo" value={contactPhone || 'Não definido'} detail="telefone atualizado pelo painel" icon="☏" />
          </div>
          {notice ? <div className={`notice ${notice.kind}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Fechar aviso">×</button></div> : null}
          {error ? <div className="notice error" role="alert">{error}<button onClick={() => void refreshData()}>Tentar novamente</button></div> : null}
          <div className="workspace">
            {tab === 'products' ? (
              <ProductSection categories={categories} products={products} busy={loading} onSave={saveProduct} onRemove={(id, name) => void remove(`/api/admin/products/${id}`, `o produto "${name}"`)} />
            ) : tab === 'categories' ? (
              <CategorySection categories={categories} busy={loading} onSave={saveCategory} onRemove={(id, name) => void remove(`/api/admin/categories/${id}`, `a categoria "${name}"`)} />
            ) : tab === 'messages' ? (
              <MessagesSection messages={messages} busy={loading} onToggleRead={(id, read) => void updateMessage(id, read)} onRemove={(id, name) => void remove(`/api/admin/messages/${id}`, `a mensagem de "${name}"`)} />
            ) : (
              <SettingsSection phone={contactPhone} onPhoneChange={setContactPhone} onSave={saveSettings} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function tabLabel(tab: Tab) {
  return tab === 'products' ? 'Produtos' : tab === 'categories' ? 'Categorias' : tab === 'messages' ? 'Mensagens' : 'Configurações';
}

function StatCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: string }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-detail">{detail}</span></article>;
}

function ProductSection({
  categories,
  products,
  busy,
  onSave,
  onRemove,
}: {
  categories: Category[];
  products: Product[];
  busy: boolean;
  onSave: (event: FormEvent<HTMLFormElement>, product: Product | undefined, specifications: ProductSpecification[]) => Promise<boolean>;
  onRemove: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState<Product | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);

  function startEdit(product: Product) {
    setEditing(product);
    setSpecifications(product.specifications);
    setShowForm(true);
  }

  function updateSpecification(index: number, field: keyof ProductSpecification, value: string) {
    setSpecifications((current) => current.map((specification, itemIndex) =>
      itemIndex === index ? { ...specification, [field]: value } : specification,
    ));
  }

  return (
    <section className="panel">
      <div className="panel-header"><div><h2>Produtos cadastrados</h2><p>Atualize as peças exibidas no catálogo mobile.</p></div><button className="primary-button compact" onClick={() => { setEditing(undefined); setSpecifications([]); setShowForm((open) => !open); }}>{showForm ? 'Fechar formulário' : '+ Novo produto'}</button></div>
      {showForm ? (
        <form className="editor-form" key={editing?.id ?? 'new-product'} onSubmit={async (event) => { if (await onSave(event, editing, specifications)) { setEditing(undefined); setSpecifications([]); setShowForm(false); } }}>
          <h3>{editing ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="form-grid">
            <Field label="Nome" name="name" defaultValue={editing?.name} required />
            <Field label="Modelo" name="model" defaultValue={editing?.model} required />
            <label className="field"><span>Categoria</span><select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <Field label="Descrição" name="description" defaultValue={editing?.description} />
          </div>
          <div className="specification-editor">
            <div className="specification-heading"><div><h4>Especificações</h4><p>Adicione propriedades personalizadas, como tensão, compatibilidade ou dimensões.</p></div><button type="button" className="secondary-button" onClick={() => setSpecifications((current) => [...current, { property: '', value: '' }])}>+ Adicionar</button></div>
            {specifications.map((specification, index) => (
              <div className="specification-row" key={index}>
                <label className="field"><span>Propriedade</span><input value={specification.property} maxLength={80} onChange={(event) => updateSpecification(index, 'property', event.target.value)} placeholder="Ex.: Tensão" /></label>
                <label className="field"><span>Valor</span><input value={specification.value} maxLength={240} onChange={(event) => updateSpecification(index, 'value', event.target.value)} placeholder="Ex.: 12V" /></label>
                <button type="button" className="remove-specification" aria-label="Remover especificação" onClick={() => setSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remover</button>
              </div>
            ))}
          </div>
          <ImagePicker currentImageUrl={editing?.imageUrl ?? null} />
          {categories.length === 0 ? <p className="inline-error">Cadastre uma categoria antes de criar produtos.</p> : null}
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => { setEditing(undefined); setSpecifications([]); setShowForm(false); }}>Cancelar</button><button className="primary-button" type="submit" disabled={categories.length === 0}>{editing ? 'Salvar alterações' : 'Cadastrar produto'}</button></div>
        </form>
      ) : null}
      {busy ? <LoadingNotice /> : products.length === 0 ? <EmptyNotice>Cadastre o primeiro produto para exibi-lo no aplicativo.</EmptyNotice> : (
        <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Modelo</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          {products.map((product) => <tr key={product.id}><td><div className="catalog-item"><Image src={product.imageUrl ?? '/icons/products.svg'} alt="" width={54} height={44} unoptimized /><div><strong>{product.name}</strong><small>{product.specifications[0] ? `${product.specifications[0].property}: ${product.specifications[0].value}` : 'Sem especificações informadas'}</small></div></div></td><td>{product.categoryName}</td><td>{product.model}</td><td><span className={product.active ? 'pill active-pill' : 'pill'}>{product.active ? 'Ativo' : 'Arquivado'}</span></td><td><div className="row-actions"><button onClick={() => startEdit(product)}>Editar</button>{product.active ? <button className="delete-action" onClick={() => onRemove(product.id, product.name)}>Remover</button> : null}</div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

function MessagesSection({
  messages,
  busy,
  onToggleRead,
  onRemove,
}: {
  messages: ContactMessage[];
  busy: boolean;
  onToggleRead: (id: string, read: boolean) => void;
  onRemove: (id: string, name: string) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header"><div><h2>Mensagens recebidas</h2><p>Solicitações enviadas pelo formulário de contato do aplicativo.</p></div></div>
      {busy ? <LoadingNotice /> : messages.length === 0 ? <EmptyNotice>Ainda não há mensagens recebidas pelo aplicativo.</EmptyNotice> : (
        <div className="message-list">{messages.map((message) => (
          <article className={message.readAt ? 'message-card' : 'message-card unread-message'} key={message.id}>
            <div className="message-heading"><div><h3>{message.name}</h3><span>{message.phone} · {new Date(message.createdAt).toLocaleString('pt-BR')}</span></div><span className={message.readAt ? 'pill' : 'pill active-pill'}>{message.readAt ? 'Lida' : 'Nova'}</span></div>
            <p>{message.message}</p>
            <div className="row-actions"><button onClick={() => onToggleRead(message.id, !message.readAt)}>{message.readAt ? 'Marcar como não lida' : 'Marcar como lida'}</button><button className="delete-action" onClick={() => onRemove(message.id, message.name)}>Excluir</button></div>
          </article>
        ))}</div>
      )}
    </section>
  );
}

function CategorySection({
  categories,
  busy,
  onSave,
  onRemove,
}: {
  categories: Category[];
  busy: boolean;
  onSave: (event: FormEvent<HTMLFormElement>, category?: Category) => Promise<boolean>;
  onRemove: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState<Category | undefined>();
  const [showForm, setShowForm] = useState(false);
  return (
    <section className="panel">
      <div className="panel-header"><div><h2>Categorias do catálogo</h2><p>Organize as peças em grupos fáceis de encontrar.</p></div><button className="primary-button compact" onClick={() => { setEditing(undefined); setShowForm((open) => !open); }}>{showForm ? 'Fechar formulário' : '+ Nova categoria'}</button></div>
      {showForm ? (
        <form className="editor-form" key={editing?.id ?? 'new-category'} onSubmit={async (event) => { if (await onSave(event, editing)) { setEditing(undefined); setShowForm(false); } }}>
          <h3>{editing ? 'Editar categoria' : 'Nova categoria'}</h3>
          <div className="form-grid"><Field label="Nome" name="name" defaultValue={editing?.name} required /><Field label="Descrição" name="description" defaultValue={editing?.description} /></div>
          <ImagePicker currentImageUrl={editing?.imageUrl ?? null} />
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => { setEditing(undefined); setShowForm(false); }}>Cancelar</button><button className="primary-button" type="submit">{editing ? 'Salvar alterações' : 'Cadastrar categoria'}</button></div>
        </form>
      ) : null}
      {busy ? <LoadingNotice /> : categories.length === 0 ? <EmptyNotice>Cadastre a primeira categoria do catálogo.</EmptyNotice> : (
        <div className="category-grid">{categories.map((category) => <article className="category-card" key={category.id}><Image className="category-card-image" src={category.imageUrl ?? '/icons/categories.svg'} alt="" width={56} height={56} unoptimized /><h3>{category.name}</h3><p>{category.description || 'Sem descrição.'}</p><span>{category.productCount} produto(s)</span><div className="row-actions"><button onClick={() => { setEditing(category); setShowForm(true); }}>Editar</button><button className="delete-action" onClick={() => onRemove(category.id, category.name)}>Remover</button></div></article>)}</div>
      )}
    </section>
  );
}

function ImagePicker({ currentImageUrl }: { currentImageUrl: string | null }) {
  return (
    <div className="image-picker">
      {currentImageUrl ? <Image className="image-preview" src={currentImageUrl} alt="Imagem atual" width={144} height={108} unoptimized /> : null}
      <label className="field">
        <span>Imagem (PNG, JPEG ou WebP; até 5 MB)</span>
        <input type="file" name="image" accept="image/png,image/jpeg,image/webp" />
      </label>
      {currentImageUrl ? <label className="remove-image"><input type="checkbox" name="removeImage" /> Remover imagem atual</label> : null}
    </div>
  );
}

function SettingsSection({ phone, onPhoneChange, onSave }: { phone: string; onPhoneChange: (value: string) => void; onSave: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return (
    <section className="panel settings-panel">
      <div className="panel-header"><div><h2>Informações de contato</h2><p>Este telefone aparece no aplicativo e nos links para atendimento.</p></div></div>
      <form className="editor-form" onSubmit={onSave}>
        <label className="field"><span>Telefone / WhatsApp</span><input type="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="(61) 98167-1870" required /></label>
        <div className="settings-tip"><span>i</span><p>Use o código do país ao salvar, por exemplo: +55 (61) 98167-1870. A alteração será refletida nas telas do aplicativo.</p></div>
        <div className="form-actions"><button className="primary-button" type="submit">Salvar telefone</button></div>
      </form>
    </section>
  );
}

function Field({ label, name, defaultValue = '', required = false }: { label: string; name: string; defaultValue?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} defaultValue={defaultValue} maxLength={name === 'description' ? 1000 : 240} required={required} /></label>;
}

function LoadingNotice() {
  return <div className="loading-notice"><span className="spinner" /> Carregando dados do catálogo…</div>;
}

function EmptyNotice({ children }: { children: string }) {
  return <div className="empty-notice"><span>◇</span><p>{children}</p></div>;
}
