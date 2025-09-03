import { NextRequest, NextResponse } from 'next/server';
import { put, head, BlobNotFoundError } from '@vercel/blob';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import sharp from 'sharp';
import { handleError, BadRequestError, ForbiddenError } from '../../../../lib/errors';

interface UploadResult {
  fileName: string;
  url?: string;
  error?: string;
}

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

  const { organization_id, id: user_id } = authResult.user;

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

  // Helper function to generate unique filename with Windows-style numbering
  const generateUniqueFilename = async (originalName: string): Promise<string> => {
    const baseNameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const extension = '.webp';

    // Check if the base filename already exists in this organization's media library
    const existingFiles = await sql.query(
      `SELECT filename FROM media_library
       WHERE organization_id = $1 AND filename LIKE $2`,
      [organization_id, `${baseNameWithoutExt}%${extension}`]
    );

    const existingNames = existingFiles.rows.map(row => row.filename);

    // If exact match exists, find next available number
    const exactMatch = `${baseNameWithoutExt}${extension}`;
    if (existingNames.includes(exactMatch)) {
      let counter = 1;
      while (existingNames.includes(`${baseNameWithoutExt} (${counter})${extension}`)) {
        counter++;
      }
      return `${baseNameWithoutExt} (${counter})${extension}`;
    }

    // Original filename doesn't exist, use it as-is
    return exactMatch;
  };

  for (const image of allFiles) {
    const originalFileName = image.name;

    // Generate unique filename with Windows-style numbering
    const uniqueFileName = await generateUniqueFilename(originalFileName);

    try {
      // Check if the blob already exists (for the unique filename)
      const blobMetadata = await head(uniqueFileName);
      results.push({ fileName: uniqueFileName, url: blobMetadata.url });

      // Still insert record into media library for existing files
      try {
        await sql.query(
          `INSERT INTO media_library (filename, filepath, file_type, file_size, organization_id, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uniqueFileName,
            blobMetadata.url,
            'image/webp',
            0, // We don't have the file size for existing files
            organization_id,
            user_id
          ]
        );
      } catch (dbError) {
        console.error('Failed to insert media record for existing file:', dbError);
        // Continue with the upload even if database insert fails
      }
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

          const newBlob = await put(uniqueFileName, processedImageBuffer, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'image/webp',
          });

          // Insert record into media library
          try {
            await sql.query(
              `INSERT INTO media_library (filename, filepath, file_type, file_size, organization_id, user_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                uniqueFileName,
                newBlob.url,
                'image/webp',
                processedImageBuffer.length,
                organization_id,
                user_id
              ]
            );
          } catch (dbError) {
            console.error('Failed to insert media record:', dbError);
            // Continue with the upload even if database insert fails
          }

          results.push({ fileName: uniqueFileName, url: newBlob.url });
        } catch (uploadError: unknown) {
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown error occurred during upload.';
          results.push({ fileName: originalFileName, error: uploadErrorMessage });
        }
      } else {
        // Handle other, unexpected errors from the `head` call
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred checking for existing image.';
        results.push({ fileName: originalFileName, error: errorMessage });
      }
    }
  }

  return NextResponse.json({
    message: `Processed ${allFiles.length} files.`,
    results,
  });
});