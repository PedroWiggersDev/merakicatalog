import { connection } from 'next/server';

import { readerPool } from '@/lib/db';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await context.params;
  const pool = readerPool();
  const [result, setting] = await Promise.all([
    pool.query(`
      SELECT p.id, p.name, p.model, p.description, p.specifications, p.image_url,
             p.category_id, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1 AND p.active = true
    `, [id]),
    pool.query("SELECT value FROM app_settings WHERE key = 'contact_phone'"),
  ]);

  if (!result.rows[0]) return Response.json({ error: 'Produto não encontrado.' }, { status: 404 });
  const row = result.rows[0];
  return Response.json({
    product: {
      id: row.id,
      name: row.name,
      model: row.model,
      description: row.description,
      specifications: row.specifications,
      imageUrl: row.image_url,
      categoryId: row.category_id,
      categoryName: row.category_name,
    },
    contactPhone: setting.rows[0]?.value ?? '',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
