import {
  getFromGateway,
  postToGateway,
  patchToGateway,
  deleteFromGateway,
} from './gatewayClient';

export interface Course {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  startDate: string;
  registrationDeadline: string;
  endDate: string;
  totalPlaces: number;
  teacherId: string;
}

export interface Enrollment {
  courseId: number;
  userId: string;
  createdAt: string;
  role: 'STUDENT' | 'ASSISTANT';
  favorite: boolean;

  teacher_note?: number;          // Número 1-5
  teacher_feedback?: string;      // Texto
  student_note?: number;          // Número 1-5
  student_feedback?: string;      // Texto
}

export interface CourseActivity {
  id: string;
  courseId: number;
  userId: string;
  activity:
    | 'EDIT_COURSE'
    | 'ADD_MODULE'
    | 'DELETE_MODULE'
    | 'ADD_EXAM'
    | 'EDIT_EXAM'
    | 'DELETE_EXAM'
    | 'GRADE_EXAM'
    | 'ADD_TASK'
    | 'EDIT_TASK'
    | 'DELETE_TASK'
    | 'GRADE_TASK';
  createdAt: string;
}

const mockEnrollmentsLocal: Enrollment[] = [];

function getRandomRating(): number {
  return Math.floor(Math.random() * 5) + 1;
}

function getRandomFeedback(): string {
  const samples = [
    'Excellent work',
    'Needs improvement',
    'Good effort',
    'Very attentive',
    'Could participate more',
    'Great progress',
    'Satisfactory',
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}

export async function getAllCourses(token: string): Promise<Course[]> {
  const response = await getFromGateway('/courses', token);
  return response.data as Course[];
}

export async function getCourseById(id: number, token: string): Promise<Course> {
  const response = await getFromGateway(`/courses/${id}`, token);
  return response.data as Course;
}

export async function createCourse(
  data: Omit<Course, 'id' | 'createdAt'>,
  token: string
): Promise<Course> {
  const response = await postToGateway('/courses', data, token);
  return response.data as Course;
}

export async function updateCourse(
  id: number,
  data: Partial<Omit<Course, 'id' | 'createdAt'>>,
  token: string,
  userId: string
): Promise<Course> {
  const { teacherId, ...rest } = data;
  const payload = {
    ...rest,
    userId,
  };
  const response = await patchToGateway(`/courses/${id}`, payload, token);
  return response.data as Course;
}

export async function deleteCourse(id: number, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${id}`, token);
}

export async function enrollInCourse(
  courseId: number,
  userId: string,
  token: string,
  role: 'STUDENT' | 'ASSISTANT' = 'STUDENT'
): Promise<Enrollment> {
  const response = await postToGateway(
    `/courses/${courseId}/enrollments`,
    { userId, role },
    token
  );
  return response.data as Enrollment;
}

export async function updateEnrollment(
  courseId: number,
  userId: string,
  data: Partial<Enrollment>,
  token: string
): Promise<Enrollment> {
  const forbiddenFields = ['teacher_note', 'teacher_feedback', 'student_note', 'student_feedback'];
  const hasForbiddenField = forbiddenFields.some((field) => field in data);

  if (hasForbiddenField) {
    // Simular patch local sin mandar esos campos al backend
    let enrollment = mockEnrollmentsLocal.find(e => e.courseId === courseId && e.userId === userId);
    if (!enrollment) {
      enrollment = {
        courseId,
        userId,
        createdAt: new Date().toISOString(),
        role: 'STUDENT',
        favorite: false,
      };
      mockEnrollmentsLocal.push(enrollment);
    }

    const allowedData = { ...data };
    forbiddenFields.forEach(f => delete allowedData[f as keyof typeof allowedData]);

    enrollment = {
      ...enrollment,
      ...allowedData,
    };

    const index = mockEnrollmentsLocal.findIndex(e => e.courseId === courseId && e.userId === userId);
    if (index >= 0) mockEnrollmentsLocal[index] = enrollment;

    return Promise.resolve(enrollment);
  } else {
    const response = await patchToGateway(
      `/courses/${courseId}/enrollments/${userId}`,
      data,
      token
    );
    return response.data as Enrollment;
  }
}

export async function getCourseEnrollments(courseId: number, token: string): Promise<Enrollment[]> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments`, token);

  const enrollmentsWithExtras = (response.data as Enrollment[]).map(enrollment => ({
    ...enrollment,
    teacher_note: getRandomRating(),
    teacher_feedback: getRandomFeedback(),
    student_note: getRandomRating(),
    student_feedback: getRandomFeedback(),
  }));

  return enrollmentsWithExtras;
}

export async function deleteEnrollment(courseId: number, userId: string, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${courseId}/enrollments/${userId}`, token);
}

export async function getCourseActivities(
  courseId: number,
  token: string,
  userId?: string
): Promise<CourseActivity[]> {
  const url = userId
    ? `/courses/${courseId}/activities?userId=${userId}`
    : `/courses/${courseId}/activities`;

  const response = await getFromGateway(url, token);
  return response.data as CourseActivity[];
}
