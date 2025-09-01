import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { z } from 'zod';
import { VercelPoolClient } from '@vercel/postgres';
import { handleError, BadRequestError, ForbiddenError } from '@/lib/errors';

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  design: z.string().min(1, "Design is required"),
  color: z.string().min(1, "Color is required"),
  quality: z.string().min(1, "Quality is required"),
  packaging: z.string().min(1, "Packaging is required"),
  image_url: z.string().url("Image URL must be a valid URL").optional().or(z.literal('')),
});

type ProductCsvRow = z.infer<typeof productSchema>;

const parseCsv = (fileContent: string): Promise<Papa.ParseResult<ProductCsvRow>> => {
  return new Promise((resolve, reject) => {
    Papa.parse<ProductCsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: resolve,
      error: reject,
    });
  });
};

export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }
  const { organization_id } = authResult.user;

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    throw new BadRequestError('No file uploaded');
  }

  const fileContent = await file.text();
  let results;
  try {
    results = await parseCsv(fileContent);
  } catch {
    throw new BadRequestError('Error parsing CSV file');
  }

  const allRows = results.data;
  const errorRows: { row: number; errors: string[] }[] = [];
  const productsToCreate: ProductCsvRow[] = [];
  const skusInFile = new Set<string>();

  allRows.forEach((row, index) => {
    const rowIndex = index + 2;
    const parsed = productSchema.safeParse(row);

    if (!parsed.success) {
      errorRows.push({ row: rowIndex, errors: Object.values(parsed.error.flatten().fieldErrors).flat() });
      return;
    }
    if (skusInFile.has(parsed.data.sku)) {
      errorRows.push({ row: rowIndex, errors: [`Duplicate SKU '${parsed.data.sku}' in this CSV file.`] });
      return;
    }
    skusInFile.add(parsed.data.sku);
    productsToCreate.push(parsed.data);
  });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const existingProductsResult = await client.query(`SELECT sku FROM products WHERE organization_id = $1`, [organization_id as number]);
    const existingProductSkus = new Set(existingProductsResult.rows.map((p: { sku: string }) => p.sku));

    const productsToInsert = productsToCreate.filter(p => !existingProductSkus.has(p.sku));
    const skippedProducts = productsToCreate
      .filter(p => existingProductSkus.has(p.sku))
      .map(p => ({ sku: p.sku, name: p.name }));

    if (productsToInsert.length > 0) {
      const attributesResult = await client.query(`SELECT id, value, type FROM product_attributes WHERE organization_id = $1`, [organization_id as number]);
      const attributesMap = new Map(attributesResult.rows.map((a: { type: string, value: string, id: number }) => [`${a.type.toLowerCase()}:${a.value.toLowerCase()}`, a.id]));

      const findOrCreateAttribute = async (client: VercelPoolClient, type: string, value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return;
        const key = `${type.toLowerCase()}:${trimmedValue.toLowerCase()}`;
        if (!attributesMap.has(key)) {
          const newAttr = await client.query(
            `INSERT INTO product_attributes (organization_id, type, value) VALUES ($1, $2, $3) RETURNING id`,
            [organization_id as number, type, trimmedValue]
          );
          attributesMap.set(key, newAttr.rows[0].id);
        }
      };

      for (const product of productsToInsert) {
        await findOrCreateAttribute(client, 'category', product.category);
        await findOrCreateAttribute(client, 'design', product.design);
        await findOrCreateAttribute(client, 'color', product.color);
        for (const quality of product.quality.split(',').map(q => q.trim()).filter(Boolean)) {
          await findOrCreateAttribute(client, 'quality', quality);
        }
        for (const packaging of product.packaging.split(',').map(p => p.trim()).filter(Boolean)) {
          await findOrCreateAttribute(client, 'packaging_type', packaging);
        }
      }

      for (const product of productsToInsert) {
        // 1. Insert base product
        const { rows: [newProduct] } = await client.query(
          `INSERT INTO products (organization_id, name, sku, category, design, color, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            organization_id as number,
            product.name,
            product.sku,
            product.category.trim(),
            product.design.trim(),
            product.color.trim(),
            product.image_url || null,
          ]
        );
        const newProductId = newProduct.id;

        // 2. Link qualities
        const qualities = product.quality.split(',').map(q => q.trim()).filter(Boolean);
        for (const qualityName of qualities) {
          const attributeId = attributesMap.get(`quality:${qualityName.toLowerCase()}`);
          if (attributeId) {
            await client.query(
              `INSERT INTO product_to_quality (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [newProductId, attributeId]
            );
          }
        }

        // 3. Link packaging types
        const packagingTypes = product.packaging.split(',').map(p => p.trim()).filter(Boolean);
        for (const packagingName of packagingTypes) {
          const attributeId = attributesMap.get(`packaging_type:${packagingName.toLowerCase()}`);
          if (attributeId) {
            await client.query(
              `INSERT INTO product_to_packaging_type (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [newProductId, attributeId]
            );
          }
        }

        // Note: inventory_summary entries will be created automatically when production logs are added
      }
    }
    
    await client.query('COMMIT');

    return NextResponse.json({
      totalRows: allRows.length,
      importedCount: productsToInsert.length,
      skippedCount: skippedProducts.length,
      errorCount: errorRows.length,
      importedProducts: productsToInsert.map(p => ({ sku: p.sku, name: p.name })),
      skippedProducts,
      errorRows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});