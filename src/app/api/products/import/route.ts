import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { z } from 'zod';

// Define the schema for a single product row in the CSV
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

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const { organization_id } = req.user;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    const fileContent = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const allRows = results.data as z.infer<typeof productSchema>[];
            const errorRows: { row: number; errors: string[] }[] = [];
            const productsToCreate: z.infer<typeof productSchema>[] = [];

            // 1. Fetch existing product SKUs for validation
            const existingProductsResult = await db.query(
              `SELECT sku FROM products WHERE organization_id = $1`,
              [organization_id]
            );
            const existingProductSkus = new Set(existingProductsResult.rows.map(p => p.sku));
            const skusInFile = new Set<string>();

            // 2. Validate all rows and categorize them
            allRows.forEach((row, index) => {
              const rowIndex = index + 2; // CSV rows are 1-based, plus header
              const parsed = productSchema.safeParse(row);

              if (!parsed.success) {
                errorRows.push({
                  row: rowIndex,
                  errors: Object.values(parsed.error.flatten().fieldErrors).flat(),
                });
                return;
              }
              
              if (skusInFile.has(parsed.data.sku)) {
                errorRows.push({
                  row: rowIndex,
                  errors: [`Duplicate SKU '${parsed.data.sku}' in this CSV file.`],
                });
                return;
              }

              skusInFile.add(parsed.data.sku);
              productsToCreate.push(parsed.data);
            });

            // 3. Separate products into "to insert" and "to skip"
            const productsToInsert = productsToCreate.filter(p => !existingProductSkus.has(p.sku));
            const skippedProducts = productsToCreate
              .filter(p => existingProductSkus.has(p.sku))
              .map(p => ({ sku: p.sku, name: p.name }));

            // 4. If there are products to insert, proceed with transaction
            if (productsToInsert.length > 0) {
              const client = await db.connect();
              try {
                await client.query('BEGIN');

                const attributesResult = await client.query(
                  `SELECT id, value, type FROM product_attributes WHERE organization_id = $1`,
                  [organization_id]
                );
                const attributesMap = new Map(attributesResult.rows.map(a => [`${a.type.toLowerCase()}:${a.value.toLowerCase()}`, a.id]));

                const findOrCreateAttribute = async (type: string, value: string) => {
                  const trimmedValue = value.trim();
                  if (!trimmedValue) return;
                  const key = `${type.toLowerCase()}:${trimmedValue.toLowerCase()}`;
                  if (!attributesMap.has(key)) {
                    const newAttr = await client.query(
                      `INSERT INTO product_attributes (organization_id, type, value) VALUES ($1, $2, $3) RETURNING id`,
                      [organization_id, type, trimmedValue]
                    );
                    attributesMap.set(key, newAttr.rows[0].id);
                  }
                };

                for (const product of productsToInsert) {
                  await findOrCreateAttribute('category', product.category);
                  await findOrCreateAttribute('design', product.design);
                  await findOrCreateAttribute('color', product.color);
                  for (const quality of product.quality.split(',').map(q => q.trim()).filter(Boolean)) {
                    await findOrCreateAttribute('quality', quality);
                  }
                  for (const packaging of product.packaging.split(',').map(p => p.trim()).filter(Boolean)) {
                    await findOrCreateAttribute('packaging_type', packaging);
                  }
                }

                for (const product of productsToInsert) {
                  await client.query(
                    `INSERT INTO products (
                      organization_id, name, sku, category, design, color,
                      available_qualities, available_packaging_types, image_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                      organization_id,
                      product.name,
                      product.sku,
                      product.category.trim(),
                      product.design.trim(),
                      product.color.trim(),
                      product.quality.split(',').map(q => q.trim()).filter(Boolean),
                      product.packaging.split(',').map(p => p.trim()).filter(Boolean),
                      product.image_url || null,
                    ]
                  );
                }

                await client.query('COMMIT');
              } catch (e) {
                await client.query('ROLLBACK');
                throw e;
              } finally {
                client.release();
              }
            }

            // 5. Compile and return the final report
            return resolve(NextResponse.json({
              totalRows: allRows.length,
              importedCount: productsToInsert.length,
              skippedCount: skippedProducts.length,
              errorCount: errorRows.length,
              importedProducts: productsToInsert.map(p => ({ sku: p.sku, name: p.name })),
              skippedProducts,
              errorRows,
            }));

          } catch (dbError) {
            console.error('[PRODUCT_IMPORT_DB_ERROR]', dbError);
            return reject(new NextResponse('Internal Server Error', { status: 500 }));
          }
        },
        error: (error: Error) => {
          console.error('[PRODUCT_IMPORT_PARSE_ERROR]', error);
          return reject(new NextResponse('Error parsing CSV file', { status: 400 }));
        },
      });
    });

  } catch (error) {
    console.error('[PRODUCT_IMPORT_API]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}, ['FACTORY_ADMIN']);