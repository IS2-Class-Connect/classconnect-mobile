// services/courseApi.ts

import {
  getFromGateway,
  postToGateway,
  patchToGateway,
  deleteFromGateway,
} from './gatewayClient';

/**
 * Interface representing a Course entity.
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
 * Fetch all courses
 */
export async function getAllCourses(token: string): Promise<Course[]> {
  const response = await getFromGateway('/courses', token);
  console.log('✅ Courses fetched:', response);
  return response as Course[];
}

/**
 * Fetch one course by ID
 */
export async function getCourseById(id: number, token: string): Promise<Course> {
  const response = await getFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} fetched:`, response);
  return response as Course;
}

/**
 * Create a new course
 */
export async function createCourse(
  data: Omit<Course, 'id' | 'createdAt'>, // incluye teacherId
  token: string
): Promise<Course> {
  const response = await postToGateway('/courses', data, token);
  console.log('✅ Course created:', response);
  return response as Course;
}

/**
 * Update an existing course
 */
export async function updateCourse(
  id: number,
  data: Partial<Course>,
  token: string
): Promise<Course> {
  const response = await patchToGateway(`/courses/${id}`, data, token);
  console.log(`✅ Course ${id} updated:`, response);
  return response as Course;
}

/**
 * Delete a course by ID
 */
export async function deleteCourse(id: number, token: string): Promise<void> {
  await deleteFromGateway(`/courses/${id}`, token);
  console.log(`✅ Course ${id} deleted`);
}
