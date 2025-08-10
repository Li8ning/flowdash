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
  model: z.string().optional(),
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
            const productsToCreate = results.data as z.infer<typeof productSchema>[];
            const errors: { row: number; errors: { [k: string]: string[] } }[] = [];

            // 1. Fetch existing attributes and product codes for validation
            const attributesResult = await db.query(
              `SELECT id, value, type FROM product_attributes WHERE organization_id = $1`,
              [organization_id]
            );
            const attributesMap = new Map(attributesResult.rows.map(a => [`${a.type.toLowerCase()}:${a.value.toLowerCase()}`, a.id]));

            const existingProductsResult = await db.query(
              `SELECT sku FROM products WHERE organization_id = $1`,
              [organization_id]
            );
            const existingProductSkus = new Set(existingProductsResult.rows.map(p => p.sku));

            // 2. Validate each row
            productsToCreate.forEach((row, index) => {
              const rowIndex = index + 2;
              const rowErrors: { [k: string]: string[] } = {};

              const parsed = productSchema.safeParse(row);
              if (!parsed.success) {
                errors.push({ row: rowIndex, errors: parsed.error.flatten().fieldErrors });
                return; // Continue to next row
              }

              // Check for duplicate sku in the file itself
              const duplicateInFile = productsToCreate.slice(0, index).some(p => p.sku === row.sku);
              if (duplicateInFile) {
                  rowErrors.sku = [`Duplicate SKU in CSV file.`];
              }
              
              if (existingProductSkus.has(row.sku)) {
                rowErrors.sku = [`SKU '${row.sku}' already exists.`];
              }

              // --- Single Value Attribute Validation ---
              if (!attributesMap.has(`category:${row.category.toLowerCase()}`)) {
                rowErrors.category = [`Category '${row.category}' not found. Please add it in the settings.`];
              }
              if (!attributesMap.has(`design:${row.design.toLowerCase()}`)) {
                rowErrors.design = [`Design '${row.design}' not found. Please add it in the settings.`];
              }
              if (!attributesMap.has(`color:${row.color.toLowerCase()}`)) {
                rowErrors.color = [`Color '${row.color}' not found. Please add it in the settings.`];
              }

              // --- Multi-Value Attribute Validation (Quality) ---
              const qualities = row.quality.split(',').map(q => q.trim());
              const invalidQualities = qualities.filter(q => !attributesMap.has(`quality:${q.toLowerCase()}`));
              if (invalidQualities.length > 0) {
                rowErrors.quality = [`The following qualities were not found: ${invalidQualities.join(', ')}. Please add them in settings.`];
              }

              // --- Multi-Value Attribute Validation (Packaging) ---
              const packagings = row.packaging.split(',').map(p => p.trim());
              const invalidPackagings = packagings.filter(p => !attributesMap.has(`packaging_type:${p.toLowerCase()}`));
               if (invalidPackagings.length > 0) {
                rowErrors.packaging = [`The following packaging types were not found: ${invalidPackagings.join(', ')}. Please add them in settings.`];
              }

              if (Object.keys(rowErrors).length > 0) {
                errors.push({ row: rowIndex, errors: rowErrors });
              }
            });

            if (errors.length > 0) {
              // Create a new CSV with an "errors" column
              const errorDetails = errors.reduce((acc, err) => {
                acc[err.row] = Object.entries(err.errors)
                  .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                  .join('; ');
                return acc;
              }, {} as Record<number, string>);

              const dataWithErrors = (results.data as Record<string, unknown>[]).map((row, index) => {
                const rowIndex = index + 2;
                return {
                  ...row,
                  errors: errorDetails[rowIndex] || '',
                };
              });

              const csvWithError = Papa.unparse(dataWithErrors);
              const blob = new Blob([csvWithError], { type: 'text/csv;charset=utf-8;' });

              // Return a NextResponse with the blob
              return resolve(new NextResponse(blob, {
                status: 400,
                headers: {
                  'Content-Type': 'text/csv',
                  'Content-Disposition': `attachment; filename="import_errors.csv"`,
                },
              }));
            }

            // 4. If no errors, proceed with transaction
            const client = await db.connect();
            try {
              await client.query('BEGIN');

              for (const product of productsToCreate) {
                await client.query(
                  `INSERT INTO products (
                    organization_id, name, sku, category, design, color, model,
                    available_qualities, available_packaging_types, image_url
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                  [
                    organization_id,
                    product.name,
                    product.sku,
                    product.category,
                    product.design,
                    product.color,
                    product.model || null,
                    product.quality.split(',').map(q => q.trim()),
                    product.packaging.split(',').map(p => p.trim()),
                    product.image_url || null,
                  ]
                );
              }

              await client.query('COMMIT');
            } catch (e) {
              await client.query('ROLLBACK');
              throw e; // Rethrow to be caught by outer catch block
            } finally {
              client.release();
            }

            return resolve(NextResponse.json({
              message: 'Import successful',
              count: productsToCreate.length,
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