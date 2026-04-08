// PHQ-9 and GAD-7 Test Questions

import { PHQ9Question, GAD7Question, ResponseOption } from '../types/index.js';

// Standard PHQ-9 Questions (Depression Screening) - Clinically Validated
export const PHQ9_QUESTIONS: PHQ9Question[] = [
  { id: 'phq9_1', text: 'Little interest or pleasure in doing things', order: 1 },
  { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', order: 2 },
  { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', order: 3 },
  { id: 'phq9_4', text: 'Feeling tired or having little energy', order: 4 },
  { id: 'phq9_5', text: 'Poor appetite or overeating', order: 5 },
  { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', order: 6 },
  { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', order: 7 },
  { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed, or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', order: 8 },
  { id: 'phq9_9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way', order: 9 }
];

// Standard GAD-7 Questions (Anxiety Screening) - Clinically Validated
export const GAD7_QUESTIONS: GAD7Question[] = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', order: 1 },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying', order: 2 },
  { id: 'gad7_3', text: 'Worrying too much about different things', order: 3 },
  { id: 'gad7_4', text: 'Trouble relaxing', order: 4 },
  { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', order: 5 },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', order: 6 },
  { id: 'gad7_7', text: 'Feeling afraid as if something awful might happen', order: 7 }
];

// Standard Response Scale (Used for Both PHQ-9 and GAD-7) - Refers to "last 2 weeks"
export const RESPONSE_OPTIONS: ResponseOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

// PHQ-9 Score Interpretation (Standard Clinical Thresholds)
export const PHQ9_THRESHOLDS = {
  minimal: { min: 0, max: 4, label: 'Minimal' },
  mild: { min: 5, max: 9, label: 'Mild' },
  moderate: { min: 10, max: 14, label: 'Moderate' },
  moderately_severe: { min: 15, max: 19, label: 'Moderately Severe' },
  severe: { min: 20, max: 27, label: 'Severe' }
};

// GAD-7 Score Interpretation (Standard Clinical Thresholds)
export const GAD7_THRESHOLDS = {
  minimal: { min: 0, max: 4, label: 'Minimal anxiety' },
  mild: { min: 5, max: 9, label: 'Mild anxiety' },
  moderate: { min: 10, max: 14, label: 'Moderate anxiety' },
  severe: { min: 15, max: 21, label: 'Severe anxiety' }
};

// CRITICAL: PHQ-9 Question 9 Crisis Detection
// If PHQ-9 Q9 score ≥ 1, flag as HIGH RISK and alert doctor
export const PHQ9_Q9_CRISIS_THRESHOLD = 1; // Any score ≥ 1 on Q9 is high risk

// Crisis keywords for detection (enhanced for PHQ-9 Q9)
export const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'hurt myself', 'self-harm', 'cut myself', 'no reason to live', 'can\'t go on',
  'thoughts of death', 'hurting yourself', 'better off dead', 'ending it all',
  'not worth living', 'want to disappear', 'wish I was dead'
];

// Crisis resources
export const CRISIS_RESOURCES = {
  en: {
    hotline: '988 (Suicide & Crisis Lifeline)',
    emergency: '911',
    text: 'Text HOME to 741741 (Crisis Text Line)',
    international: '1-800-273-8255'
  },
  hi: {
    hotline: 'AASRA: 91-22-27546669',
    emergency: '112',
    text: 'iCall: 022-25521111',
    international: 'Vandrevala Foundation: 1860-2662-345'
  }
};
