import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { put, head, BlobNotFoundError } from '@vercel/blob';
import sharp from 'sharp';

interface UploadResult {
  fileName: string;
  url?: string;
  error?: string;
}

export const POST = withAuth(
  async (request: AuthenticatedRequest) => {
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
  },
  ['FACTORY_ADMIN']
);