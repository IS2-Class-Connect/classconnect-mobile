import { v4 as uuidv4 } from 'uuid';

// ENUMS
export type AssessmentType = 'Exam' | 'Task';
export type ExerciseType = 'multiple_choice' | 'open';

// Exercise definition
export interface AssessmentExercise {
  type: ExerciseType;
  enunciate: string;
  link?: string;
  choices?: string[];
  answer?: string;
}

// Submission model: one per userId per assessment
export interface AssessmentSubmission {
  note?: number;
  feedback?: string;
  AI_feedback?: string;
  [exerciseId: string]: any;
}

// Assessment model
export interface Assessment {
  id: string;
  courseId: number;
  title: string;
  description: string;
  type: AssessmentType;
  tolerance_time: number;
  start_time: string;
  deadline: string;
  created_time: string;
  teacher_id: string;
  exercises: Record<string, AssessmentExercise>;
  submissions: Record<string, AssessmentSubmission>;
}

// In-memory storage and config
const mockAssessments: Record<string, Assessment> = {};
const PAGE_SIZE = 10;

function generateKey(courseId: number, id: string): string {
  return `${courseId}-${id}`;
}

function safeDate(input?: string): Date | null {
  return input ? new Date(input) : null;
}

// Filter DTO matching backend expectations
export interface AssessmentFilterDto {
  title?: string;
  type?: AssessmentType;        // 'Exam' or 'Task'
  day?: string;                 // 'YYYY-MM-DD'
  userId?: string;              // teacher_id
}

// CREATE assessment
export async function createAssessment(
  data: Omit<Assessment, 'id' | 'created_time' | 'submissions' | 'teacher_id'>,
  userId: string
): Promise<Assessment> {
  const id = uuidv4();
  const created_time = new Date().toISOString();
  const full: Assessment = {
    ...data,
    id,
    created_time,
    teacher_id: userId,
    submissions: {},
  };
  mockAssessments[generateKey(data.courseId, id)] = full;
  return full;
}

// UPDATE assessment
export async function updateAssessment(
  courseId: number,
  id: string,
  data: Partial<Omit<Assessment, 'id' | 'created_time' | 'submissions'>>,
  userId: string
): Promise<Assessment> {
  const key = generateKey(courseId, id);
  if (!mockAssessments[key]) throw new Error('Assessment not found');
  mockAssessments[key] = {
    ...mockAssessments[key],
    ...data,
    teacher_id: userId,
  };
  return mockAssessments[key];
}

// DELETE assessment
export async function deleteAssessment(
  courseId: number,
  id: string
): Promise<void> {
  const key = generateKey(courseId, id);
  delete mockAssessments[key];
}

// GET paginated and filtered assessments for a course
// GET paginated and filtered assessments for a course
export async function getAssessmentsByCourse(
  courseId: number,
  page: number = 1,
  filters: AssessmentFilterDto = {}
): Promise<{ assessments: Assessment[]; total: number; page: number }> {
  let filtered = Object.values(mockAssessments).filter(
    (a) => a.courseId === courseId
  );

  // Filter by type
  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  // Filter by title (case-insensitive partial match)
  if (filters.title) {
    const title = filters.title.toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(title));
  }

  // Filter by teacher_id
  if (filters.userId) {
    filtered = filtered.filter((a) => a.teacher_id === filters.userId);
  }

  // Filter by day: includes assessments active during the selected day
  if (filters.day) {
    const target = new Date(filters.day);
    target.setHours(12, 0, 0, 0); // midday to avoid timezone edge cases

    filtered = filtered.filter((a) => {
      const start = new Date(a.start_time);
      const end = new Date(a.deadline);
      return start <= target && end >= target;
    });
  }

  const total = filtered.length;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  return {
    assessments: filtered.slice(start, end),
    total,
    page,
  };
}


// SUBMIT an assessment (stores user responses)
export async function submitAssessment(
  courseId: number,
  id: string,
  userId: string,
  responses: Record<string, any>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, id);
  const assessment = mockAssessments[key];
  if (!assessment) throw new Error('Assessment not found');
  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...responses,
  };
  return assessment.submissions[userId];
}

// MANUAL correction of a submission
export async function correctAssessmentManually(
  courseId: number,
  id: string,
  userId: string,
  correction: Partial<AssessmentSubmission>
): Promise<AssessmentSubmission> {
  const key = generateKey(courseId, id);
  const assessment = mockAssessments[key];
  if (!assessment || !assessment.submissions[userId]) throw new Error('Submission not found');
  assessment.submissions[userId] = {
    ...assessment.submissions[userId],
    ...correction,
  };
  return assessment.submissions[userId];
}

// MOCKED AI correction for one open-ended exercise
export async function getAIAssessmentCorrection(
  courseId: number,
  id: string,
  userId: string,
  exerciseId: string
): Promise<string> {
  const key = generateKey(courseId, id);
  const answer = mockAssessments[key]?.submissions[userId]?.[exerciseId]?.answer;
  if (!answer) return 'No answer provided.';
  return `AI Score: 8.5. Your explanation is correct, but could benefit from real-world examples.`;
}
