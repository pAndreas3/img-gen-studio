/**
 * Extracts the file key from a model URL.
 * Handles both R2 URLs (r2://bucket-name/path/to/file) and standard HTTPS URLs.
 * 
 * @param url - The model URL to extract the key from
 * @returns The file key/path for use with storage operations
 */
export function extractFileKeyFromUrl(url: string): string {
    if (url.startsWith('r2://')) {
        // Format: r2://bucket-name/path/to/file
        // Extract everything after the bucket name
        const urlParts = url.replace('r2://', '').split('/');
        return urlParts.slice(1).join('/'); // Skip bucket name, join the rest
    } else {
        // Standard HTTPS URL format
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading slash
    }
}
