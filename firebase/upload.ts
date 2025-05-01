import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload an image to Firebase Storage and return its download URL
 */
export async function uploadImageAsync(uri: string, path: string): Promise<string> {
  try {
    console.log('🚀 Starting image upload...');
    console.log('URI received:', uri);
    console.log('Storage path:', path);

    // Validate the URI
    if (!uri || !uri.startsWith('file://')) {
      console.log('❌ Invalid URI detected:', uri);
      throw new Error('Invalid file URI for upload');
    }

    // Fetch the image and convert it to a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    console.log('📦 Blob created. Size:', blob.size, 'Type:', blob.type);

    if (blob.size === 0) {
      console.log('❌ Blob is empty!');
      throw new Error('Blob size is 0, cannot upload.');
    }

    // Reference to Firebase storage path
    const storageRef = ref(storage, path);

    console.log('🔗 Storage ref created:', storageRef.fullPath);

    // Upload the Blob to Firebase Storage
    console.log('⬆️ Uploading to Firebase Storage...');
    await uploadBytes(storageRef, blob);
    console.log('✅ Upload completed.');

    // Get the public download URL
    const url = await getDownloadURL(storageRef);

    console.log('🌐 Download URL obtained:', url);
    return url;
  } catch (error) {
    console.log('❌ Error during upload process:', error);
    throw error;
  }
}
