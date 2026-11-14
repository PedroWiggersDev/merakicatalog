import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { jsonError } from '@/lib/api';

const formats = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
} as const;

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  const match = /^([0-9a-f-]+)\.(png|jpg|webp)$/.exec(filename);
  if (!match) return jsonError('Imagem não encontrada.', 404);
  const extension = match[2] as keyof typeof formats;
  const uploadDirectory = path.join(process.cwd(), 'storage', 'uploads');

  try {
    const image = await readFile(path.join(uploadDirectory, filename));
    return new Response(image, {
      headers: {
        'Content-Type': formats[extension],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return jsonError('Imagem não encontrada.', 404);
    console.error('[public-upload] Could not read uploaded image', error);
    return jsonError('Não foi possível carregar a imagem.', 500);
  }
}
