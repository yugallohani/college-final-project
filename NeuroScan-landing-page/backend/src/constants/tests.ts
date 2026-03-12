// PHQ-9 and GAD-7 Test Questions

import { PHQ9Question, GAD7Question, ResponseOption } from '../types/index.js';

export const PHQ9_QUESTIONS: PHQ9Question[] = [
  { id: 'phq9_1', text: 'Little interest or pleasure in doing things', order: 1 },
  { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', order: 2 },
  { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', order: 3 },
  { id: 'phq9_4', text: 'Feeling tired or having little energy', order: 4 },
  { id: 'phq9_5', text: 'Poor appetite or overeating', order: 5 },
  { id: 'phq9_6', text: 'Feeling bad about yourself or that you are a failure', order: 6 },
  { id: 'phq9_7', text: 'Trouble concentrating on things', order: 7 },
  { id: 'phq9_8', text: 'Moving or speaking slowly, or being fidgety or restless', order: 8 },
  { id: 'phq9_9', text: 'Thoughts that you would be better off dead or of hurting yourself', order: 9 }
];

export const GAD7_QUESTIONS: GAD7Question[] = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', order: 1 },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying', order: 2 },
  { id: 'gad7_3', text: 'Worrying too much about different things', order: 3 },
  { id: 'gad7_4', text: 'Trouble relaxing', order: 4 },
  { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', order: 5 },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', order: 6 },
  { id: 'gad7_7', text: 'Feeling afraid as if something awful might happen', order: 7 }
];

export const RESPONSE_OPTIONS: ResponseOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

// PHQ-9 Thresholds
export const PHQ9_THRESHOLDS = {
  minimal: { min: 0, max: 4 },
  mild: { min: 5, max: 9 },
  moderate: { min: 10, max: 14 },
  moderately_severe: { min: 15, max: 19 },
  severe: { min: 20, max: 27 }
};

// GAD-7 Thresholds
export const GAD7_THRESHOLDS = {
  minimal: { min: 0, max: 4 },
  mild: { min: 5, max: 9 },
  moderate: { min: 10, max: 14 },
  severe: { min: 15, max: 21 }
};

// Crisis keywords for detection
export const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'hurt myself', 'self-harm', 'cut myself', 'no reason to live', 'can\'t go on'
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
