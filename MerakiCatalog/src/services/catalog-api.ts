import type {
  CatalogResponse,
  ProductResponse,
} from '@/types/catalog';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export function getImageUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!apiBaseUrl) throw new Error('Configure EXPO_PUBLIC_API_URL para carregar imagens do catálogo.');
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('Configure EXPO_PUBLIC_API_URL para conectar ao catálogo.');
  }

  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new Error('Não foi possível conectar ao catálogo. Verifique sua conexão.');
  } finally {
    clearTimeout(timeout);
  }

  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : `O catálogo respondeu com erro (${response.status}).`;
    throw new Error(message);
  }
  return result as T;
}

export function getCatalog(): Promise<CatalogResponse> {
  return request<CatalogResponse>('/api/public/catalog');
}

export async function checkCatalogConnection(): Promise<void> {
  await request<{ status: string }>('/api/health');
}

export function getProduct(id: string): Promise<ProductResponse> {
  return request<ProductResponse>(`/api/public/products/${encodeURIComponent(id)}`);
}

export function submitContactMessage(input: { name: string; phone: string; message: string }): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/public/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
