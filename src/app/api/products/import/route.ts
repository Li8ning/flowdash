import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { z } from 'zod';
import { VercelPoolClient } from '@vercel/postgres';
import { handleError, BadRequestError, ForbiddenError } from '@/lib/errors';
import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import sharp from 'sharp';

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  design: z.string().min(1, "Design is required"),
  color: z.string().min(1, "Color is required"),
  quality: z.string().min(1, "Quality is required"),
  packaging: z.string().min(1, "Packaging is required"),
  image_url: z.string().optional(),
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

const getImageHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const processImagesInParallel = async (products: ProductCsvRow[], organizationId: number, userId: number) => {
  const results = new Map<string, number | null>();
  const concurrencyLimit = 3; // Safe for Vercel free plan

  // Process in batches to control concurrency
  for (let i = 0; i < products.length; i += concurrencyLimit) {
    const batch = products.slice(i, i + concurrencyLimit);

    const batchPromises = batch.map(async (product) => {
      if (product.image_url) {
        const mediaId = await handleImageUrl(product.image_url, organizationId, userId, product.name);
        results.set(product.sku, mediaId);
      }
    });

    // Wait for current batch to complete
    await Promise.allSettled(batchPromises);

    // Small delay between batches to be respectful to Vercel
    if (i + concurrencyLimit < products.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
};

// Optimized helper function to handle image URLs during import
const handleImageUrl = async (imageUrl: string, organizationId: number, userId: number, productName: string): Promise<number | null> => {
  if (!imageUrl || !imageUrl.trim()) return null;

  const trimmedUrl = imageUrl.trim();

  try {
    // Download image with timeout
    const response = await fetch(trimmedUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'FlowDash-Import/1.0' },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image from ${trimmedUrl}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.warn(`Invalid content type for ${trimmedUrl}: ${contentType}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.warn(`Empty image downloaded from ${trimmedUrl}`);
      return null;
    }

    // Generate content hash for duplicate detection
    const contentHash = getImageHash(buffer);

    // Check for existing image with same content
    const existingImage = await sql.query(
      'SELECT id FROM media_library WHERE content_hash = $1 AND organization_id = $2',
      [contentHash, organizationId]
    );

    if (existingImage.rows.length > 0) {
      console.log(`Duplicate image found for ${productName}, reusing existing media ID: ${existingImage.rows[0].id}`);
      return existingImage.rows[0].id;
    }

    // Optimize image with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(500, 500, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Generate base filename (without extension)
    const urlParts = trimmedUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1] || 'imported-image.jpg';
    const baseFilename = originalFilename.replace(/\.[^/.]+$/, ''); // Remove extension

    // Let Vercel Blob handle uniqueness with random suffix
    const blobFilename = `${baseFilename}.webp`;

    // Upload to Vercel Blob
    const blob = await put(blobFilename, optimizedBuffer, {
      access: 'public',
      addRandomSuffix: true, // Vercel adds random text for uniqueness
      contentType: 'image/webp',
    });

    // Store base filename (without extension) in database
    const mediaResult = await sql.query(
      `INSERT INTO media_library (organization_id, user_id, filename, filepath, file_type, file_size, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [organizationId, userId, baseFilename, blob.url, 'image/webp', optimizedBuffer.length, contentHash]
    );

    console.log(`Successfully processed image for ${productName}: ${optimizedBuffer.length} bytes (${Math.round((buffer.length - optimizedBuffer.length) / buffer.length * 100)}% size reduction)`);
    return mediaResult.rows[0].id;

  } catch (error) {
    console.error(`Error processing image ${trimmedUrl} for ${productName}:`, error);
    return null;
  }
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

      // Process images in parallel before creating products
      const productsWithImages = productsToInsert.filter(p => p.image_url);
      const imageResults = await processImagesInParallel(productsWithImages, organization_id as number, authResult.user.id as number);

      for (const product of productsToInsert) {
        // 1. Get media ID from parallel processing results
        const mediaId = imageResults.get(product.sku) || null;

        // 2. Insert base product
        const { rows: [newProduct] } = await client.query(
          `INSERT INTO products (organization_id, name, sku, category, design, color)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            organization_id as number,
            product.name,
            product.sku,
            product.category.trim(),
            product.design.trim(),
            product.color.trim(),
          ]
        );
        const newProductId = newProduct.id;

        // 3. Link media if available
        if (mediaId) {
          await client.query(
            `INSERT INTO product_images (product_id, media_id) VALUES ($1, $2)`,
            [newProductId, mediaId]
          );
        }

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