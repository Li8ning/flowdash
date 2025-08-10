import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import sharp from 'sharp';
import logger from '@/lib/logger';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Process image with Sharp
    const buffer = await file.arrayBuffer();
    const processedImageBuffer = await sharp(buffer)
      .resize(500, 500, {
        fit: 'cover', // Crop to cover both dimensions
        position: 'entropy', // Smart crop focus
      })
      .webp({ quality: 80 }) // Convert to WebP for best compression/quality
      .toBuffer();

    const filename = file.name || 'uploaded-image.webp';
    
    const blob = await put(filename, processedImageBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    return NextResponse.json(blob);
  } catch (err) {
    logger.error({ err }, 'Failed to upload image');
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to upload image.', details: errorMessage }, { status: 500 });
  }
}, ['factory_admin']);