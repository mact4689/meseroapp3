
/**
 * Compresses and resizes an image file using browser Canvas API.
 * Target: WebP format, max 800x800px, 0.8 quality.
 */
export const compressImage = async (file: File): Promise<File> => {
    // 1. Skip if not an image
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // 2. Constants
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    const QUALITY = 0.8;
    const MIME_TYPE = 'image/webp';

    return new Promise((resolve, _reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // 3. Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                // 4. Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fallback: return original
                    return;
                }

                // 5. Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file); // Fallback
                        return;
                    }

                    // 6. Create new File
                    // Change extension to .webp
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const compressedFile = new File([blob], newName, {
                        type: MIME_TYPE,
                        lastModified: Date.now(),
                    });

                    console.log(`[ImageOptimizer] Compressed: ${file.size} -> ${compressedFile.size} bytes`);
                    resolve(compressedFile);
                }, MIME_TYPE, QUALITY);
            };

            img.onerror = (err) => {
                console.error("Error loading image for compression", err);
                resolve(file); // Return original if fail
            };
        };

        reader.onerror = (err) => {
            console.error("Error reading file for compression", err);
            resolve(file);
        };
    });
};
