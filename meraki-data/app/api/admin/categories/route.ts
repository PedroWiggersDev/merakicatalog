import { authorizeMutation, isRecord, jsonError, readJson, reportDatabaseError } from '@/lib/api';
import { getAdminSession } from '@/lib/auth';
import { writerPool } from '@/lib/db';
import { isUploadedImagePath } from '@/lib/validation';

export async function GET() {
  if (!await getAdminSession()) return jsonError('Autenticação necessária.', 401);
  try {
    const result = await writerPool().query(`
      SELECT c.id, c.name, c.description, c.image_url, COUNT(p.id)::int AS product_count
      FROM categories c LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id ORDER BY c.name
    `);
    return Response.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      productCount: row.product_count,
    })));
  } catch (error) {
    return reportDatabaseError('admin-categories-list', error);
  }
}

export async function POST(request: Request) {
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

  try {
    const result = await writerPool().query(
      'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id, name, description, image_url',
      [name, body.value.description.trim(), body.value.imageUrl],
    );
    return Response.json({ id: result.rows[0].id, name: result.rows[0].name, description: result.rows[0].description, imageUrl: result.rows[0].image_url, productCount: 0 }, { status: 201 });
  } catch (error) {
    if (isRecord(error) && error.code === '23505') return jsonError('Já existe uma categoria com esse nome.', 409);
    return reportDatabaseError('admin-categories-create', error);
  }
}
