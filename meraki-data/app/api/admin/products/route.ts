import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { getAdminSession } from '@/lib/auth';
import { writerPool } from '@/lib/db';
import { isProductInput } from '@/lib/validation';

export async function GET() {
  if (!await getAdminSession()) return jsonError('Autenticação necessária.', 401);
  try {
    const result = await writerPool().query(`
      SELECT p.id, p.name, p.model, p.description, p.specifications, p.image_url,
             p.category_id, c.name AS category_name, p.active
      FROM products p JOIN categories c ON c.id = p.category_id
      ORDER BY p.name, p.model
    `);
    return Response.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      model: row.model,
      description: row.description,
      specifications: row.specifications,
      imageUrl: row.image_url,
      categoryId: row.category_id,
      categoryName: row.category_name,
      active: row.active,
    })));
  } catch (error) {
    return reportDatabaseError('admin-products-list', error);
  }
}

export async function POST(request: Request) {
  const denied = await authorizeMutation(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body.response) return body.response;
  if (!isProductInput(body.value)) return jsonError('Preencha os campos obrigatórios do produto.', 400);

  const product = body.value;
  try {
    const result = await writerPool().query(`
      INSERT INTO products (name, model, description, specifications, image_url, category_id)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)
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
    ]);
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    if (isRecord(error) && error.code === '23503') return jsonError('Selecione uma categoria válida.', 400);
    return reportDatabaseError('admin-products-create', error);
  }
}
