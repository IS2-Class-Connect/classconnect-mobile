import { getFromGateway } from './gatewayClient';

export interface CoursePerformanceDto {
  averageGrade: number;
  completionRate: number;
  totalAssessments: number;
  totalSubmissions: number;
  openRate: number;
}

export interface StudentPerformanceInCourseDto {
  averageGrade: number;
  completedAssessments: number;
  totalAssessments: number;
}

export interface AssessmentPerformanceDto {
  title: string;
  averageGrade: number;
  completionRate: number;
}

// 🔹 Get course-wide performance summary
export async function getCoursePerformanceSummary(
  courseId: number,
  token: string,
  from?: string,
  till?: string
): Promise<CoursePerformanceDto> {
  const params = new URLSearchParams();
  if (from) params.append('from', new Date(from).toISOString());
  if (till) params.append('till', new Date(till).toISOString());

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await getFromGateway(`/courses/${courseId}/performance/summary${query}`, token);
  console.log('Course performance response:', response);
  return response.data as CoursePerformanceDto;
}

// 🔹 Get performance summary of a specific student in a course
export async function getStudentPerformanceSummary(
  courseId: number,
  studentId: string,
  token: string
): Promise<StudentPerformanceInCourseDto> {
  const response = await getFromGateway(
    `/courses/${courseId}/performance/students/${studentId}`,
    token
  );
  return response.data as StudentPerformanceInCourseDto;
}

// 🔹 Get list of performance stats by assessment
export async function getAssessmentPerformanceSummary(
  courseId: number,
  token: string
): Promise<AssessmentPerformanceDto[]> {
  const response = await getFromGateway(
    `/courses/${courseId}/performance/by-assessment`,
    token
  );
  return response.data as AssessmentPerformanceDto[];
}
