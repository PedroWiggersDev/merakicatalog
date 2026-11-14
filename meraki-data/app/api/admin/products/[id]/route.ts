import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { writerPool } from '@/lib/db';
import { isProductInput } from '@/lib/validation';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body.response) return body.response;
  if (!isProductInput(body.value)) return jsonError('Preencha os campos obrigatórios do produto.', 400);
  const product = body.value;
  const { id } = await context.params;

  try {
    const result = await writerPool().query(`
      UPDATE products
      SET name = $1, model = $2, description = $3, specifications = $4::jsonb, image_url = $5, category_id = $6
      WHERE id = $7
      RETURNING id, name, model, description, specifications, image_url, category_id
    `, [
      product.name.trim(),
      product.model.trim(),
      product.description.trim(),
      JSON.stringify(product.specifications.map(({ property, value }) => ({
        property: property.trim(),
        value: value.trim(),
      }))),
      product.imageUrl,
      product.categoryId,
      id,
    ]);
    if (!result.rows[0]) return jsonError('Produto não encontrado.', 404);
    return Response.json(result.rows[0]);
  } catch (error) {
    if (isRecord(error) && error.code === '23503') return jsonError('Selecione uma categoria válida.', 400);
    return reportDatabaseError('admin-products-update', error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const result = await writerPool().query(
      'UPDATE products SET active = false WHERE id = $1 AND active = true RETURNING id',
      [id],
    );
    if (!result.rows[0]) return jsonError('Produto não encontrado.', 404);
    return Response.json({ success: true });
  } catch (error) {
    return reportDatabaseError('admin-products-delete', error);
  }
}
