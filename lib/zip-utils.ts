import JSZip from 'jszip';

/**
 * Creates a ZIP file from an array of files
 * @param files Array of File objects to be zipped
 * @param zipFileName Name for the ZIP file (without extension)
 * @returns Promise that resolves to a File object containing the ZIP
 */
export async function createZipFromFiles(files: File[], zipFileName: string): Promise<File> {
  const zip = new JSZip();
  
  // Add each file to the ZIP
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Use original filename, but add index if there are duplicates
    const fileName = `${String(i + 1).padStart(3, '0')}_${file.name}`;
    zip.file(fileName, file);
  }
  
  // Generate the ZIP file as a blob
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // Balanced compression (1-9, where 9 is maximum compression)
    }
  });
  
  // Convert blob to File object
  const zipFile = new File([zipBlob], `${zipFileName}.zip`, {
    type: 'application/zip',
    lastModified: Date.now()
  });
  
  return zipFile;
}

/**
 * Gets the total size of files in bytes
 * @param files Array of File objects
 * @returns Total size in bytes
 */
export function getTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Formats file size in human readable format
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
