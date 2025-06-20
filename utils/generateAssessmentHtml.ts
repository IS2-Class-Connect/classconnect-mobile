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
          : `<p style="margin-top:8px;">_____________________________</p>`;
      return `
        <div class="exercise">
          <h3>Ejercicio ${idx + 1}</h3>
          <p class="enunciate">${ex.enunciate}</p>
          ${ex.link ? `<p><em>Recurso: ${ex.link}</em></p>` : ''}
          ${body}
        </div>
      `;
    })
    .join('');

  // Duración
  const toleranceHours = assessment.toleranceTime ?? 'N/A';
  const durationText =
    typeof toleranceHours === 'number'
      ? `${toleranceHours} ${toleranceHours === 1 ? 'hour' : 'hours'}`
      : toleranceHours;

  // Tipo en mayúsculas
  const capitalizedType = assessment.type.toUpperCase();

  // Return HTML
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
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
