import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { put, head, BlobNotFoundError } from '@vercel/blob';
import sharp from 'sharp';

interface UploadResult {
  fileName: string;
  url?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const images = formData.getAll('images') as File[];

  if (!images || images.length === 0) {
    return NextResponse.json({ error: 'No images provided.' }, { status: 400 });
  }

  const results: UploadResult[] = [];

  for (const image of images) {
    const fileName = image.name;
    try {
      // Check if the blob already exists
      const blobMetadata = await head(fileName);
      results.push({ fileName, url: blobMetadata.url });
    } catch (error: unknown) {
      if (error instanceof BlobNotFoundError) {
        // If the blob does not exist, upload it
        try {
          const buffer = await image.arrayBuffer();
          const processedImageBuffer = await sharp(buffer)
            .resize(500, 500, {
              fit: 'inside', // Resize to fit within 500x500, no cropping
              withoutEnlargement: true, // Don't enlarge smaller images
            })
            .webp({ quality: 80 })
            .toBuffer();

          // Ensure the filename uses the .webp extension
          const webpFileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";

          const newBlob = await put(webpFileName, processedImageBuffer, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'image/webp',
          });
          results.push({ fileName: webpFileName, url: newBlob.url });
        } catch (uploadError: unknown) {
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown error occurred during upload.';
          results.push({ fileName, error: uploadErrorMessage });
        }
      } else {
        // Handle other, unexpected errors from the `head` call
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred checking for existing image.';
        results.push({ fileName, error: errorMessage });
      }
    }
  }

  return NextResponse.json({
    message: 'Bulk image upload processed.',
    results,
  });
}