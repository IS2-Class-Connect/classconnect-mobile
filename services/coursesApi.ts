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

  teacher_note?: number;
  teacher_feedback?: string;
  student_note?: number;
  student_feedback?: string;
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
  const response = await patchToGateway(
    `/courses/${courseId}/enrollments/${userId}`,
    data,
    token
  );
  return response.data as Enrollment;
}

export async function getCourseEnrollments(courseId: number, token: string): Promise<Enrollment[]> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments`, token);
  return response.data as Enrollment[];
}

export async function getEnrollmentsByUser(
  userId: string,
  token: string
): Promise<Enrollment[]> {
  const response = await getFromGateway(`/courses/enrollments?userId=${userId}`, token);
  return response.data as Enrollment[];
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

// FEEDBACK FUNCTIONS

export async function createCourseFeedback(
  courseId: number,
  userId: string,
  data: {
    courseNote: number;
    courseFeedback: string;
  },
  token: string
): Promise<void> {
  await postToGateway(`/courses/${courseId}/enrollments/${userId}/courseFeedback`, data, token);
}

export async function createStudentFeedback(
  courseId: number,
  userId: string,
  data: {
    studentNote: number;
    studentFeedback: string;
    teacherId: string;
  },
  token: string
): Promise<void> {
  await postToGateway(`/courses/${courseId}/enrollments/${userId}/studentFeedback`, data, token);
}

export async function getCourseFeedback(
  courseId: number,
  userId: string,
  token: string
): Promise<{
  courseNote: number;
  courseFeedback: string;
  studentId: string;
}> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments/${userId}/courseFeedback`, token);
  return response.data;
}

export async function getStudentFeedback(
  courseId: number,
  userId: string,
  token: string
): Promise<{
  studentNote: number;
  studentFeedback: string;
  courseId: number;
}> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments/${userId}/studentFeedback`, token);
  return response.data;
}

export async function getAllCourseFeedbacks(
  courseId: number,
  token: string
): Promise<{
  summary: string;
  feedbacks: {
    studentId: string;
    courseNote: number;
    courseFeedback: string;
  }[];
}> {
  const response = await getFromGateway(`/courses/${courseId}/feedbacks`, token);
  return response.data;
}

export async function getAllStudentFeedbacks(
  studentId: string,
  token: string
): Promise<{
    summary: string;
    feedbacks: {
      courseId: number;
      studentNote: number;
      studentFeedback: string;
    }[];
}> {
  const response = await getFromGateway(`/courses/studentFeedbacks/${studentId}`, token);
  return response.data;
}
