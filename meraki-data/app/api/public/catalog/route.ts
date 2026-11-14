import { connection } from 'next/server';

import { readerPool } from '@/lib/db';

export async function GET() {
  await connection();
  const pool = readerPool();
  const [categories, products, settings] = await Promise.all([
    pool.query(`
      SELECT c.id, c.name, c.description, c.image_url, COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.active = true
      GROUP BY c.id
      ORDER BY c.name
    `),
    pool.query(`
      SELECT p.id, p.name, p.model, p.description, p.specifications, p.image_url,
             p.category_id, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.active = true
      ORDER BY p.name, p.model
    `),
    pool.query("SELECT value FROM app_settings WHERE key = 'contact_phone'"),
  ]);

  return Response.json({
    categories: categories.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      productCount: row.product_count,
    })),
    products: products.rows.map((row) => ({
      id: row.id,
      name: row.name,
      model: row.model,
      description: row.description,
      specifications: row.specifications,
      imageUrl: row.image_url,
      categoryId: row.category_id,
      categoryName: row.category_name,
    })),
    contactPhone: settings.rows[0]?.value ?? '',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
