import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { writerPool } from '@/lib/db';
import { isUploadedImagePath } from '@/lib/validation';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body.response) return body.response;
  if (
    !isRecord(body.value) ||
    typeof body.value.name !== 'string' ||
    typeof body.value.description !== 'string' ||
    !(body.value.imageUrl === null || isUploadedImagePath(body.value.imageUrl))
  ) {
    return jsonError('Nome e descrição da categoria são obrigatórios.', 400);
  }
  const name = body.value.name.trim();
  if (name.length < 2 || name.length > 100 || body.value.description.length > 500) {
    return jsonError('Revise o nome ou a descrição da categoria.', 400);
  }
  const { id } = await context.params;
  try {
    const result = await writerPool().query(
      'UPDATE categories SET name = $1, description = $2, image_url = $3 WHERE id = $4 RETURNING id, name, description, image_url',
      [name, body.value.description.trim(), body.value.imageUrl, id],
    );
    if (!result.rows[0]) return jsonError('Categoria não encontrada.', 404);
    return Response.json(result.rows[0]);
  } catch (error) {
    if (isRecord(error) && error.code === '23505') return jsonError('Já existe uma categoria com esse nome.', 409);
    return reportDatabaseError('admin-categories-update', error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const result = await writerPool().query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) return jsonError('Categoria não encontrada.', 404);
    return Response.json({ success: true });
  } catch (error) {
    if (isRecord(error) && error.code === '23503') {
      return jsonError('Não é possível remover uma categoria que possui produtos.', 409);
    }
    return reportDatabaseError('admin-categories-delete', error);
  }
}
