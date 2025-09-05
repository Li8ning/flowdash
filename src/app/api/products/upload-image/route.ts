import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAuth } from '@/lib/auth-utils';
import sharp from 'sharp';
import crypto from 'crypto';
import sql from '@/lib/db';
import { handleError, BadRequestError, ForbiddenError } from '@/lib/errors';

const getImageHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new BadRequestError('No file provided.');
  }

  // Process image with Sharp
  const buffer = await file.arrayBuffer();
  const processedImageBuffer = await sharp(buffer)
    .resize(500, 500, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  // Generate content hash for duplicate detection
  const contentHash = getImageHash(processedImageBuffer);

  // Check for duplicates (optional - can be controlled via env var)
  if (process.env.ENABLE_IMAGE_DEDUPLICATION === 'true') {
    const existingImage = await sql.query(
      'SELECT filepath FROM media_library WHERE content_hash = $1 AND organization_id = $2',
      [contentHash, authResult.user.organization_id]
    );

    if (existingImage.rows.length > 0) {
      return NextResponse.json({
        url: existingImage.rows[0].filepath,
        duplicate: true
      });
    }
  }

  // Generate base filename
  const baseFilename = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'uploaded-image';
  const blobFilename = `${baseFilename}.webp`;

  const blob = await put(blobFilename, processedImageBuffer, {
    access: 'public',
    addRandomSuffix: true, // Let Vercel handle uniqueness
    contentType: 'image/webp',
  });

  return NextResponse.json(blob);
});