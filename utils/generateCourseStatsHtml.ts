import { CoursePerformanceDto, StudentPerformanceInCourseDto } from '@/services/courseStatsApi';
import { AssessmentPerformanceDto } from '../services/courseStatsApi';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export async function generateCourseStatsHtml(
  assessments: AssessmentPerformanceDto[], 
  studentsStats: StudentPerformanceInCourseDto[], 
  courseStats: CoursePerformanceDto,
  studentNames: string[] 
): Promise<string> {
  // Load logo asset
  const logoAsset = Asset.fromModule(require('../assets/images/app_logo.png'));
  await logoAsset.downloadAsync();

  // Convert logo to base64
  const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const logoUri = `data:image/png;base64,${base64}`;

  // Generate assessment statistics
  const assessmentsHtml = assessments
    .map((assessment, idx) => {
      return `
        <div class="assessment">
          <h3>Assessment ${idx + 1}: ${assessment.title}</h3>
          <p><strong>Average Grade:</strong> ${assessment.averageGrade.toFixed(1)}</p>
          <p><strong>Completion Rate:</strong> ${(assessment.completionRate * 100).toFixed(0)}%</p>
        </div>
        <hr class="separator" />
      `;
    })
    .join('');

  // Generate student statistics, using the student names passed as parameters
  const studentsHtml = studentsStats
    .map((student, idx) => {
      const studentName = studentNames[idx] || `Student ${idx + 1}`; // Default to "Student X" if no name is provided
      return `
        <div class="student">
          <h3>Student ${idx + 1}: ${studentName}</h3>
          <p><strong>Average Grade:</strong> ${student.averageGrade.toFixed(1)}</p>
          <p><strong>Completed Assessments:</strong> ${student.completedAssessments} / ${student.totalAssessments}</p>
          <p><strong>Completion Rate:</strong> ${(
            (student.completedAssessments / student.totalAssessments) *
            100
          ).toFixed(0)}%</p>
        </div>
        <hr class="separator" />
      `;
    })
    .join('');

  // Generate global course statistics
  const globalStatsHtml = `
    <div class="globalStats">
      <h3>Course Statistics</h3>
      <p><strong>Average Course Grade:</strong> ${courseStats.averageGrade.toFixed(1)}</p>
      <p><strong>Total Assessments:</strong> ${courseStats.totalAssessments}</p>
      <p><strong>Total Submissions:</strong> ${courseStats.totalSubmissions}</p>
      <p><strong>Completion Rate:</strong> ${(courseStats.completionRate * 100).toFixed(1)}%</p>
      <p><strong>Open Rate:</strong> ${(courseStats.openRate * 100).toFixed(1)}%</p>
    </div>
    <hr class="separator" />
  `;

  // Final HTML string
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @media print {
            .assessment, .student {
              page-break-inside: avoid;
            }
          }

          body {
            font-family: 'Times New Roman', serif;
            padding: 32px;
            line-height: 1.6;
            text-align: center; /* Centering all text */
          }

          h1 {
            color: #165BAA;
            font-size: 28px;
            margin: 4px 0;
            text-align: center; /* Ensuring that h1 is centered */
          }

          h2 {
            color: #165BAA;
            font-size: 20px;
            margin: 8px 0 16px;
            text-align: center; /* Ensuring that h2 is centered */
          }

          h3 {
            color: #333;
            margin-bottom: 6px;
            text-align: center; /* Centering h3 headers */
          }

          .type {
            font-size: 24px;
            font-weight: bold;
            color: #165BAA;
            margin-bottom: 12px;
            text-transform: uppercase;
            text-align: center; /* Centering type */
          }

          .duration {
            margin-top: 4px;
            margin-bottom: 20px;
            font-weight: 500;
          }

          img {
            width: 100px;
            margin: 12px 0;
            display: block;
            margin-left: auto;
            margin-right: auto; /* Centering the logo */
          }

          .content {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 2px solid #ccc;
            text-align: left;
          }

          .separator {
            border: none;
            border-top: 2px solid #ccc;
            margin: 32px 0;
          }

          .assessment, .student {
            margin-bottom: 24px;
          }

          .enunciate {
            color: #165BAA;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
            margin: 8px 0 12px;
          }

          .choices {
            margin-left: 20px;
            padding-left: 16px;
          }

          .resource {
            font-size: 14px;
            color: #333;
            margin-bottom: 8px;
            text-align: left;
          }

          .resource a {
            color: #165BAA;
            text-decoration: none;
          }

          .open-space {
            margin-top: 12px;
            margin-bottom: 12px;
          }

          .line {
            border-bottom: 1px solid #888;
            margin: 10px 0;
            height: 16px;
          }

          .globalStats {
            margin-top: 32px;
            text-align: center; /* Centering the global stats section */
          }
        </style>
      </head>
      <body>
        <img src="${logoUri}" alt="ClassConnect Logo" />
        <h1>Course Stats</h1>
        <h2>Global Statistics</h2>
        ${globalStatsHtml}
        <h2>Assessments</h2>
        ${assessmentsHtml}
        <h2>Students</h2>
        ${studentsHtml}
      </body>
    </html>
  `;
}
