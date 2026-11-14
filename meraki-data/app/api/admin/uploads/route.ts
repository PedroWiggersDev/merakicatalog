import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { authorizeMutation, jsonError } from '@/lib/api';

const maxUploadBytes = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ['image/png', { extension: 'png', signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/jpeg', { extension: 'jpg', signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ['image/webp', { extension: 'webp', signature: (bytes: Buffer) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' }],
]);

export async function POST(request: Request) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxUploadBytes + 64 * 1024) {
    return jsonError('A imagem deve ter no máximo 5 MB.', 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Envie uma imagem válida.', 400);
  }

  const file = form.get('image');
  if (!(file instanceof File) || file.size === 0) return jsonError('Selecione uma imagem.', 400);
  if (file.size > maxUploadBytes) return jsonError('A imagem deve ter no máximo 5 MB.', 413);
  const format = allowedTypes.get(file.type);
  if (!format) return jsonError('Formato inválido. Use PNG, JPEG ou WebP.', 415);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!format.signature(bytes)) return jsonError('O conteúdo do arquivo não corresponde a uma imagem válida.', 415);
    const filename = `${randomUUID()}.${format.extension}`;
    const uploadDirectory = path.join(process.cwd(), 'storage', 'uploads');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });
    return Response.json({ imageUrl: `/api/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('[admin-upload] Could not store uploaded image', error);
    return jsonError('Não foi possível salvar a imagem. Tente novamente.', 500);
  }
}
