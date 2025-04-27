import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import necessary Firebase storage functions
import { storage } from './config'; // Import the configured Firebase storage instance

// Function to upload an image to Firebase Storage and return its download URL
export async function uploadImageAsync(uri: string, path: string): Promise<string> {
	try {
		// Fetch the image from the provided URI and convert it to a Blob
		const response = await fetch(uri);
		const blob = await response.blob();

		// Create a reference to the storage path in Firebase
		const storageRef = ref(storage, path);

		// Upload the Blob to the specified storage reference
		await uploadBytes(storageRef, blob);

		// Get the download URL of the uploaded image
		const url = await getDownloadURL(storageRef);

		// Log the success message and return the URL
		console.log('✅ Image uploaded, URL:', url);
		return url;
	} catch (error) {
		// Log and rethrow any errors encountered during the upload process
		console.log('❌ Error uploading image:', error);
		throw error;
	}
}