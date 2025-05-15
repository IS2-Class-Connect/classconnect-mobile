const BACKEND_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

/**
 * Sends an enrollment confirmation email to a student by hitting the backend.
 */
export async function sendEnrollmentEmail(
  studentName: string,
  courseName: string,
  studentEmail: string
) {
  try {
    const response = await fetch(`${BACKEND_URL}/email/student-enrollment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toName: studentName,
        courseName,
        studentEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send enrollment email. Status: ${response.status}`);
    }

    console.log('📧 Enrollment email request sent successfully');
  } catch (error) {
    console.error('❌ Error sending enrollment email:', error);
  }
}

/**
 * Sends a notification email when a student is assigned as a teaching assistant.
 */
export async function sendAssistantAssignmentEmail(
  studentName: string,
  professorName: string,
  courseName: string,
  studentEmail: string
) {
  try {
    const response = await fetch(`${BACKEND_URL}/email/assistant-assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toName: studentName,
        professorName,
        courseName,
        studentEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send assistant assignment email. Status: ${response.status}`);
    }

    console.log('📧 Assistant assignment email request sent successfully');
  } catch (error) {
    console.error('❌ Error sending assistant assignment email:', error);
  }
}
