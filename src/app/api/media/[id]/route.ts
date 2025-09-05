import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import { handleError, ForbiddenError, NotFoundError } from '../../../../lib/errors';

export const GET = handleError(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
  }

  // Check role-based access
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('Access denied. Media library is only accessible to administrators.');
  }

  const { organization_id } = authResult.user;
  const mediaId = parseInt(params.id, 10);

  if (isNaN(mediaId)) {
    throw new NotFoundError('Invalid media ID.');
  }

  // Get media details with organization check
  const mediaResult = await sql.query(
    `SELECT
        ml.id,
        ml.filename,
        ml.filepath,
        ml.file_type,
        ml.file_size,
        ml.created_at,
        ml.updated_at,
        ml.user_id,
        u.name as uploaded_by_name
      FROM media_library ml
      LEFT JOIN users u ON ml.user_id = u.id
      WHERE ml.id = $1 AND ml.organization_id = $2`,
    [mediaId, organization_id]
  );

  if (mediaResult.rows.length === 0) {
    throw new NotFoundError('Media file not found.');
  }

  const media = mediaResult.rows[0];

  // Get linked products (exclude archived products)
  const productsResult = await sql.query(
    `SELECT
        p.id,
        p.name,
        p.sku,
        p.category,
        p.design,
        p.color
      FROM products p
      JOIN product_images pi ON p.id = pi.product_id
      WHERE pi.media_id = $1 AND p.organization_id = $2
        AND (p.is_archived IS NULL OR p.is_archived = false)
      ORDER BY p.name`,
    [mediaId, organization_id]
  );

  return NextResponse.json({
    ...media,
    linked_products: productsResult.rows,
  });
});

export const DELETE = handleError(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
  }

  // Check role-based access
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('Access denied. Only administrators can delete media.');
  }

  const { organization_id } = authResult.user;
  const mediaId = parseInt(params.id, 10);

  if (isNaN(mediaId)) {
    throw new NotFoundError('Invalid media ID.');
  }

  // Check if media exists and belongs to the organization, get filepath
  const mediaResult = await sql.query(
    'SELECT id, filepath FROM media_library WHERE id = $1 AND organization_id = $2',
    [mediaId, organization_id]
  );

  if (mediaResult.rows.length === 0) {
    throw new NotFoundError('Media file not found.');
  }

  const filepath = mediaResult.rows[0].filepath;

  // Delete from database (this will cascade to product_images due to foreign key constraints)
  await sql.query('DELETE FROM media_library WHERE id = $1', [mediaId]);

  // Delete file from Vercel Blob storage
  try {
    await del(filepath);
  } catch (blobError) {
    // Log blob deletion error but don't fail the entire operation
    console.error(`Failed to delete blob file: ${filepath}`, blobError);
  }

  return NextResponse.json({
    message: 'Media file deleted successfully.',
    deleted_id: mediaId,
  });
});