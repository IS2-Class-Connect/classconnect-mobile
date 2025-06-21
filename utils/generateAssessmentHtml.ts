import { Assessment } from '../services/assessmentsApi';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

/**
 * Generates an academic-style HTML string for PDF export of an assessment.
 */
export async function generateAssessmentHtml(assessment: Assessment): Promise<string> {
  // Load logo asset
  const logoAsset = Asset.fromModule(require('../assets/images/app_logo.png'));
  await logoAsset.downloadAsync();

  // Convert logo to base64
  const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const logoUri = `data:image/png;base64,${base64}`;

  // Generate exercises
  const exercisesHtml = assessment.exercises
    .map((ex, idx) => {
      const options = ex.choices?.map(c => `<li>${c}</li>`).join('') || '';
      const body =
        ex.type === 'multiple_choice'
          ? `<ul class="choices">${options}</ul>`
          : `<div class="open-space">
               ${'<div class="line"></div>'.repeat(10)}
             </div>`;

      const linkHtml = ex.link
        ? `<p class="resource"><em>Resource: <a href="${ex.link}" target="_blank">${ex.link}</a></em></p>`
        : '';

      return `
        <div class="exercise">
          ${idx > 0 ? '<hr class="separator" />' : ''}
          <h3>Exercise ${idx + 1}</h3>
          <p class="enunciate">${ex.enunciate}</p>
          ${linkHtml}
          ${body}
        </div>
      `;
    })
    .join('');

  const toleranceHours = assessment.toleranceTime ?? 'N/A';
  const durationText =
    typeof toleranceHours === 'number'
      ? `${toleranceHours} ${toleranceHours === 1 ? 'hour' : 'hours'}`
      : toleranceHours;

  const capitalizedType = assessment.type.toUpperCase();

  // Final HTML string
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @media print {
            .exercise {
              page-break-inside: avoid;
            }
          }

          body {
            font-family: 'Times New Roman', serif;
            padding: 32px;
            line-height: 1.6;
            text-align: center;
          }

          h1 {
            color: #165BAA;
            font-size: 28px;
            margin: 4px 0;
          }

          h2 {
            color: #165BAA;
            font-size: 20px;
            margin: 8px 0 16px;
          }

          h3 {
            color: #333;
            margin-bottom: 6px;
            text-align: left;
          }

          .type {
            font-size: 24px;
            font-weight: bold;
            color: #165BAA;
            margin-bottom: 12px;
            text-transform: uppercase;
          }

          .duration {
            margin-top: 4px;
            margin-bottom: 20px;
            font-weight: 500;
          }

          img {
            width: 100px;
            margin: 12px 0;
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

          .exercise {
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
        </style>
      </head>
      <body>
        <div class="type">${capitalizedType}</div>
        <img src="${logoUri}" alt="ClassConnect Logo" />
        <h1>${assessment.title}</h1>
        <h2>${assessment.description}</h2>
        <div class="duration"><strong>Estimated Duration:</strong> ${durationText}</div>
        <div class="content">
          ${exercisesHtml}
        </div>
      </body>
    </html>
  `;
}
