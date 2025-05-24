import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload an image or video to Firebase Storage and return its download URL.
 * Accepts only MIME types starting with 'image/' or 'video/'.
 */
export async function uploadMediaAsync(uri: string, path: string): Promise<string> {
  try {
    console.log('🚀 Starting media upload...');
    console.log('URI received:', uri);
    console.log('Storage path:', path);

    // Validate the URI
    if (!uri || !uri.startsWith('file://')) {
      console.log('❌ Invalid URI detected:', uri);
      throw new Error('Invalid file URI for upload');
    }

    // Fetch the file and convert it to a Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    console.log('📦 Blob created. Size:', blob.size, 'Type:', blob.type);

    if (blob.size === 0) {
      console.log('❌ Blob is empty!');
      throw new Error('Blob size is 0, cannot upload.');
    }

    // Validate media type
    if (!blob.type.startsWith('image/') && !blob.type.startsWith('video/')) {
      console.log('❌ Unsupported MIME type:', blob.type);
      throw new Error('Only images and videos are allowed.');
    }

    // Reference to Firebase Storage
    const storageRef = ref(storage, path);

    console.log('🔗 Storage ref created:', storageRef.fullPath);

    // Upload the file
    console.log('⬆️ Uploading to Firebase Storage...');
    await uploadBytes(storageRef, blob);
    console.log('✅ Upload completed.');

    // Get public download URL
    const url = await getDownloadURL(storageRef);
    console.log('🌐 Download URL obtained:', url);
    return url;
  } catch (error) {
    console.log('❌ Error during upload process:', error);
    throw error;
  }
}
