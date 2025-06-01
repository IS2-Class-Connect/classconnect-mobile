import { postToGateway } from './gatewayClient';

const TOKEN = process.env.EXPO_PUBLIC_GATEWAY_TOKEN;

export async function sendEnrollmentEmail(
  uuid: string,
  studentName: string,
  courseName: string,
  studentEmail: string
) {
  try {
    await postToGateway(
      '/email/student-enrollment',
      {
        uuid,
        toName: studentName,
        courseName,
        studentEmail,
        topic: 'enrollment',
      },
      TOKEN
    );
    console.log('📧 Enrollment email request sent successfully');
  } catch (error) {
    console.error('❌ Error sending enrollment email:', error);
  }
}

export async function sendAssistantAssignmentEmail(
  uuid: string,
  studentName: string,
  professorName: string,
  courseName: string,
  studentEmail: string
) {
  try {
    await postToGateway(
      '/email/assistant-assignment',
      {
        uuid,
        toName: studentName,
        professorName,
        courseName,
        studentEmail,
        topic: 'assistant-assignment',
      },
      TOKEN
    );
    console.log('📧 Assistant assignment email request sent successfully');
  } catch (error) {
    console.error('❌ Error sending assistant assignment email:', error);
  }
}
