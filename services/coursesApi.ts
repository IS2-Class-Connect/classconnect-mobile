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
}

export async function getAllCourses(token: string): Promise<Course[]> {
  const response = await getFromGateway('/courses', token);
  console.log('✅ Courses fetched:', response);
  return response.data as Course[];
}

export async function getCourseById(id: number, token: string): Promise<Course> {
  const response = await getFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} fetched:`, response);
  return response.data as Course;
}

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
 * - Automatically removes teacherId
 * - Ensures startDate, registrationDeadline and endDate are present to pass validation
 */
export async function updateCourse(
  id: number,
  data: Partial<Omit<Course, 'id' | 'createdAt'>>,
  token: string,
  userId: string
): Promise<Course> {
  const { teacherId, ...rest } = data; //

  const payload = {
    ...rest,
    userId, 
  };

  console.log('PATCH payload:', payload);

  const response = await patchToGateway(`/courses/${id}`, payload, token);
  return response.data as Course;
}





export async function deleteCourse(id: number, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} deleted`);
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
  console.log(`✅ User ${userId} enrolled in course ${courseId}`);
  return response.data as Enrollment;
}

export async function updateEnrollment(
  courseId: number,
  userId: string,
  data: Partial<Pick<Enrollment, 'favorite' | 'role'>>,
  token: string
): Promise<Enrollment> {
  const response = await patchToGateway(
    `/courses/${courseId}/enrollments/${userId}`,
    data,
    token
  );
  console.log(`✅ Enrollment for user ${userId} in course ${courseId} updated`);
  return response.data as Enrollment;
}

export async function getCourseEnrollments(courseId: number, token: string): Promise<Enrollment[]> {
  const response = await getFromGateway(`/courses/${courseId}/enrollments`, token);
  console.log(`✅ Enrollments for course ${courseId} fetched`);
  return response.data as Enrollment[];
}

export async function deleteEnrollment(courseId: number, userId: string, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${courseId}/enrollments/${userId}`, token);
  console.log(`✅ Enrollment of user ${userId} in course ${courseId} deleted`);
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

export async function getCourseActivities(
  courseId: number,
  token: string,
  userId?: string
): Promise<CourseActivity[]> {
  const url = userId
    ? `/courses/${courseId}/activities?userId=${userId}`
    : `/courses/${courseId}/activities`;

  const response = await getFromGateway(url, token);
  console.log(`✅ Activity log for course ${courseId} fetched`, response.data);

  return response.data as CourseActivity[];
}
