import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import sharp from 'sharp';
import crypto from 'crypto';
import { handleError, BadRequestError, ForbiddenError } from '../../../../lib/errors';

interface UploadResult {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  duplicate?: boolean;
  error?: string;
}

const getImageHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

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
    throw new ForbiddenError('Access denied. Only administrators can upload media.');
  }

  const { organization_id, id: user_id } = authResult.user as { organization_id: number; id: number; role: string };

  if (!organization_id) {
    throw new BadRequestError('Organization not found.');
  }

  const formData = await req.formData();
  // Support both 'files' (from media upload) and 'images' (from bulk upload) form field names
  const files = formData.getAll('files') as File[];
  const images = formData.getAll('images') as File[];

  // Use files if available, otherwise use images
  const allFiles = files.length > 0 ? files : images;

  if (!allFiles || allFiles.length === 0) {
    throw new BadRequestError('No files provided.');
  }

  const results: UploadResult[] = [];

  // Helper function to extract base filename (without extension)
  const getBaseFilename = (originalName: string): string => {
    return originalName.replace(/\.[^/.]+$/, "");
  };

  for (const image of allFiles) {
    const originalFileName = image.name;

    // Extract base filename for database storage
    const baseFilename = getBaseFilename(originalFileName);
    // Create filename for blob upload (with extension)
    const blobFilename = `${baseFilename}.webp`;

    try {
      const buffer = await image.arrayBuffer();
      const processedImageBuffer = await sharp(buffer)
        .resize(500, 500, {
          fit: 'inside', // Resize to fit within 500x500, no cropping
          withoutEnlargement: true, // Don't enlarge smaller images
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Generate content hash for duplicate detection
      const contentHash = getImageHash(processedImageBuffer);

      // Check for existing image with same content
      const existingImage = await sql.query(
        'SELECT id, filename, filepath FROM media_library WHERE content_hash = $1 AND organization_id = $2',
        [contentHash, organization_id]
      );

      if (existingImage.rows.length > 0) {
        // Return existing image info
        results.push({
          id: existingImage.rows[0].id,
          filename: existingImage.rows[0].filename,
          filepath: existingImage.rows[0].filepath,
          file_type: 'image/webp',
          file_size: processedImageBuffer.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id,
          duplicate: true,
        });
        continue; // Skip to next image
      }

      const newBlob = await put(blobFilename, processedImageBuffer, {
        access: 'public',
        addRandomSuffix: true, // Let Vercel handle uniqueness
        contentType: 'image/webp',
      });

      // Insert record into media library
      try {
        const insertResult = await sql.query(
          `INSERT INTO media_library (filename, filepath, file_type, file_size, organization_id, user_id, content_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, filename, filepath, file_type, file_size, created_at, updated_at, user_id`,
          [
            baseFilename, // Store base name without extension
            newBlob.url, // Vercel's URL with random suffix
            'image/webp',
            processedImageBuffer.length,
            organization_id,
            user_id,
            contentHash
          ]
        );

        if (insertResult.rows.length > 0) {
          const row = insertResult.rows[0];
          results.push({
            id: row.id,
            filename: row.filename,
            filepath: row.filepath,
            file_type: row.file_type,
            file_size: row.file_size,
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at.toISOString(),
            user_id: row.user_id
          });
        }
      } catch (dbError) {
        console.error('Failed to insert media record:', dbError);
        // Continue with the upload even if database insert fails
        results.push({
          id: 0,
          filename: baseFilename,
          filepath: newBlob.url,
          file_type: 'image/webp',
          file_size: processedImageBuffer.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id,
          error: 'Database insert failed'
        });
      }
    } catch (uploadError: unknown) {
      const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown error occurred during upload.';
      results.push({
        id: 0,
        filename: baseFilename,
        filepath: '',
        file_type: 'image/webp',
        file_size: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id,
        error: uploadErrorMessage
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${allFiles.length} files.`,
    results,
  });
});