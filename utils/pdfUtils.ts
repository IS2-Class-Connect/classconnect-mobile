// utils/pdfUtils.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Converts raw HTML content into a PDF and triggers the system's share dialog.
 * @param html The HTML string to be rendered and exported as a PDF.
 */
export async function shareHtmlAsPdf(html: string) {
  try {
    // Generate the PDF from HTML
    const { uri } = await Print.printToFileAsync({ html });

    // Share the generated PDF file using the system share dialog
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share assessment PDF',
      UTI: 'com.adobe.pdf',
    });
  } catch (error) {
    //console.error('Failed to share PDF:', error);
    throw error;
  }
}
