# Media Library Feature Specification

## 1. Feature Overview

The Media Library will be a centralized location for users to manage all their uploaded images. It will provide a gallery view of all images, with options to upload, view, edit, and delete media files. Each organization will have its own isolated media library.

## 2. Key Features & Requirements

- **View Media:** Display all of an organization's images in a gallery view with thumbnails.
- **Upload Media:**
    - Single image upload.
    - Bulk image upload with drag-and-drop support.
- **Image Details:** View image details such as filename, upload date, file size, and dimensions.
- **Image Details View:**
    - Display the image URL for easy copying.
    - Show a list of products the image is linked to (optional).
- **Delete Media:**
    - Single image deletion.
    - Bulk image deletion.
- **Search:**
    - Search for images by filename.
- **Integration:**
    - When adding a new product, allow users to either select an existing image from the library or upload a new one directly. Uploaded images will be automatically added to the library.
- **CSV Export:**
    - After a bulk upload, provide an option to download a CSV file containing the URLs of the uploaded images.
- **Security:**
    - Users can only access the media library of their own organization.
    - Role-based access control: Only `Admin` and `Super Admin` roles can access and manage the media library. `Floor Staff` will not have access.

## 3. Database Schema

We will create a new table called `media_library` to store information about each uploaded file.

```sql
CREATE TABLE media_library (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    filepath TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**

- `media_library.organization_id` -> `organizations.id` (Many-to-One)
- `media_library.user_id` -> `users.id` (Many-to-One)
- We will need a joining table to link media to products: `product_images`

```sql
CREATE TABLE product_images (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, media_id)
);
```

The existing `products.image_url` column will be deprecated and eventually removed after migration.

## 4. API Endpoints

All endpoints will be under the `/api/media` route and will be protected by authentication and organization-level authorization.

- `GET /api/media`: List all media for the user's organization.
  - Query Params: `page`, `limit`, `search`, `sort_by`, `sort_order`
- `POST /api/media/upload`: Upload one or more new images. Returns a list of uploaded file details, including their URLs.
  - Body: `FormData` with `file` or `files`.
- `GET /api/media/{id}`: Get details for a single media file, including a list of products it's linked to.
- `DELETE /api/media/{id}`: Delete a single media file.
- `POST /api/media/bulk-delete`: Delete multiple media files.
  - Body: `{ "ids": [1, 2, 3] }`

## 5. Frontend Components

- **`MediaLibraryPage`**: The main page component that orchestrates the other components.
- **`MediaGallery`**: Displays images in a grid.
  - `MediaCard`: Represents a single image in the gallery with selection checkbox and actions.
- **`UploadModal`**: A modal for uploading new images.
- **`MediaToolbar`**: Contains search and bulk action buttons (e.g., Delete Selected).
- **`ImageSelector`**: A component to be used in the `ProductForm` to select an image from the Media Library or upload a new one.
- **`ImageViewerModal`**: A modal to display a larger version of the image, its URL, and a list of linked products.

## 6. Migration Plan

1.  **Create the new tables:** `media_library` and `product_images`.
2.  **Create a migration script:**
    - This script will iterate through all existing products.
    - For each product with an `image_url`, it will:
        - Create a new entry in the `media_library` table.
        - Create a new entry in the `product_images` table linking the product and the new media entry.
3.  **Deploy the script:** Run the migration script in a controlled environment before deploying to production.
4.  **Update the application code:**
    - Modify the product creation/editing forms to use the new `ImageSelector` component.
    - Update the product display components to fetch images from the `product_images` table.
5.  **Deprecate `products.image_url`:** Once the migration is complete and verified, the `image_url` column can be removed from the `products` table in a future release.
6.  **Remove Old Code:** The existing bulk image upload feature (`/dashboard/products/bulk-image-upload`) and its corresponding API endpoint will be removed.

## 7. User Flow

1.  A user navigates to the "Media Library" section in the dashboard.
2.  They see a gallery of all images for their organization.
3.  They can upload new images. After a bulk upload, they have the option to download a CSV of the new URLs.
4.  They can click on an image to view its details, copy its URL, and see which products it is used in.
5.  They can select multiple images and delete them in bulk.
6.  When creating or editing a product, they can either "Select Image" to open the Media Library in a modal and choose an image, or "Upload New Image" to add a new one, which also adds it to the library.