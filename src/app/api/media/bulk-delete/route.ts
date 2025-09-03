import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import { handleError, ForbiddenError, BadRequestError } from '../../../../lib/errors';

export const POST = handleError(async (req: NextRequest) => {
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

  const body = await req.json();
  const { ids } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('Please provide an array of media IDs to delete.');
  }

  // Validate that all IDs are numbers
  const validIds = ids.filter(id => typeof id === 'number' && !isNaN(id));
  if (validIds.length !== ids.length) {
    throw new BadRequestError('All IDs must be valid numbers.');
  }

  // Check which media files exist and belong to the organization
  const existingMediaResult = await sql.query(
    'SELECT id, filepath FROM media_library WHERE id = ANY($1) AND organization_id = $2',
    [validIds, organization_id]
  );

  const existingIds = existingMediaResult.rows.map(row => row.id);
  const notFoundIds = validIds.filter(id => !existingIds.includes(id));

  if (existingIds.length === 0) {
    throw new BadRequestError('None of the specified media files were found.');
  }

  // Get filepaths before deleting from database
  const filepaths = existingMediaResult.rows.map(row => row.filepath);

  // Delete from database (this will cascade to product_images due to foreign key constraints)
  const deleteResult = await sql.query(
    'DELETE FROM media_library WHERE id = ANY($1) AND organization_id = $2',
    [existingIds, organization_id]
  );

  // Delete files from Vercel Blob storage
  const blobDeletePromises = filepaths.map(async (filepath) => {
    try {
      await del(filepath);
    } catch (blobError) {
      // Log blob deletion error but don't fail the entire operation
      console.error(`Failed to delete blob file: ${filepath}`, blobError);
    }
  });

  // Wait for all blob deletions to complete
  await Promise.allSettled(blobDeletePromises);

  return NextResponse.json({
    message: `Successfully deleted ${deleteResult.rowCount} media files.`,
    deleted_count: deleteResult.rowCount,
    deleted_ids: existingIds,
    not_found_ids: notFoundIds,
  });
});