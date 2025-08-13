import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAuth } from '@/lib/auth-utils';
import sharp from 'sharp';
import { handleError, BadRequestError, ForbiddenError } from '@/lib/errors';

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

  const filename = file.name ? `${Date.now()}-${file.name}` : `${Date.now()}-uploaded-image.webp`;
  
  const blob = await put(filename, processedImageBuffer, {
    access: 'public',
    contentType: 'image/webp',
  });

  return NextResponse.json(blob);
});