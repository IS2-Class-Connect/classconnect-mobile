// services/coursesApi.mock.ts

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
  
  let mockCourses: Course[] = [
    {
      id: 1,
      title: 'Intro to React',
      description: 'Learn the basics of React and component-based architecture.',
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      registrationDeadline: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPlaces: 30,
      teacherId: 'teacher-1',
    },
    {
      id: 2,
      title: 'Advanced Node.js',
      description: 'Deep dive into backend development with Node and Express.',
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      registrationDeadline: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPlaces: 25,
      teacherId: 'teacher-2',
    },
    {
      id: 3,
      title: 'Databases 101',
      description: 'Relational and NoSQL database fundamentals.',
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      registrationDeadline: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPlaces: 20,
      teacherId: 'teacher-3',
    },
    {
      id: 4,
      title: 'Mobile Apps with React Native',
      description: 'Build mobile apps using React Native and Expo.',
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      registrationDeadline: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalPlaces: 40,
      teacherId: 'teacher-4',
    },
  ];
  
  let nextId = 5;
  
  export async function getAllCourses(_token?: string): Promise<Course[]> {
    console.log('📡 Mock GET /courses');
    return mockCourses;
  }
  
  export async function getCourseById(id: number, _token?: string): Promise<Course> {
    console.log(`📡 Mock GET /courses/${id}`);
    const course = mockCourses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    return course;
  }
  
  export async function createCourse(
    data: Omit<Course, 'id' | 'createdAt'>,
    _token?: string
  ): Promise<Course> {
    const newCourse: Course = {
      id: nextId++,
      createdAt: new Date().toISOString(),
      ...data,
    };
    mockCourses.push(newCourse);
    console.log('📡 Mock POST /courses', newCourse);
    return newCourse;
  }
  
  export async function updateCourse(
    id: number,
    data: Partial<Course>,
    _token?: string
  ): Promise<Course> {
    console.log(`📡 Mock PATCH /courses/${id}`, data);
    const course = mockCourses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found');
    Object.assign(course, data);
    return course;
  }
  
  export async function deleteCourse(id: number, _token?: string): Promise<void> {
    console.log(`📡 Mock DELETE /courses/${id}`);
    mockCourses = mockCourses.filter((c) => c.id !== id);
  }
  