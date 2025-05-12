import {
  getFromGateway,
  postToGateway,
  patchToGateway,
  deleteFromGateway,
} from './gatewayClient';

/**
 * Interface representing a Course entity returned from the backend.
 */
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

/**
 * Interface representing an enrollment entry.
 */
export interface Enrollment {
  courseId: number;
  userId: string;
  createdAt: string;
  role: 'STUDENT' | 'ASSISTANT';
  favorite: boolean;
}

/**
 * Fetch all courses
 */
export async function getAllCourses(token: string): Promise<Course[]> {
  const response = await getFromGateway('/courses', token);
  console.log('✅ Courses fetched:', response);
  return response.data as Course[];
}

/**
 * Fetch one course by ID
 */
export async function getCourseById(id: number, token: string): Promise<Course> {
  const response = await getFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} fetched:`, response);
  return response.data as Course;
}

/**
 * Create a new course
 */
export async function createCourse(
  data: Omit<Course, 'id' | 'createdAt'>,
  token: string
): Promise<Course> {
  const response = await postToGateway('/courses', data, token);
  console.log('✅ Course created:', response);
  return response.data as Course;
}

/**
 * Update an existing course
 */
export async function updateCourse(
  id: number,
  data: Partial<Omit<Course, 'id' | 'createdAt'>>,
  token: string
): Promise<Course> {
  const response = await patchToGateway(`/courses/${id}`, data, token);
  console.log(`✅ Course ${id} updated:`, response);
  return response.data as Course;
}

/**
 * Delete a course by ID
 */
export async function deleteCourse(id: number, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} deleted`);
}

/**
 * Enroll a user in a course
 */
export async function enrollInCourse(
  courseId: number,
  userId: string,
  token: string,
  role: 'STUDENT' | 'ASSISTANT' = 'STUDENT'
): Promise<Enrollment> {
  const response = await postToGateway(
    `/courses/${courseId}/enrollments`,
    { userId, role: role },
    token
  );
  console.log(`✅ User ${userId} enrolled in course ${courseId}`);
  return response.data as Enrollment;
}


/**
 * Get enrollments for a course
 */
export async function getCourseEnrollments(courseId: number, token: string): Promise<Enrollment[]> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments`, token);
  console.log(`✅ Enrollments for course ${courseId} fetched`);
  return response.data as Enrollment[];
}

/**
 * Delete an enrollment (user unenrolls)
 */
export async function deleteEnrollment(courseId: number, userId: string, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${courseId}/enrollments/${userId}`, token);
  console.log(`✅ Enrollment of user ${userId} in course ${courseId} deleted`);
}
