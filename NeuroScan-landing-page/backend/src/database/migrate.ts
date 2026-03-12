import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    
    console.log('✅ Database migrations completed successfully');
    
    // Insert sample psychologists
    await insertSamplePsychologists();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function insertSamplePsychologists() {
  console.log('📝 Inserting sample psychologists...');
  
  const psychologists = [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@neuroscan.ai',
      specialization: JSON.stringify(['Depression', 'Anxiety', 'Trauma']),
      experience: 12,
      credentials: JSON.stringify(['PhD in Clinical Psychology', 'Licensed Psychologist', 'CBT Certified']),
      rating: 4.8,
      review_count: 156,
      availability: JSON.stringify(['Monday', 'Wednesday', 'Friday']),
      bio: 'Specializing in cognitive behavioral therapy with over 12 years of experience helping individuals overcome depression and anxiety.',
      languages: JSON.stringify(['en', 'hi'])
    },
    {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@neuroscan.ai',
      specialization: JSON.stringify(['Anxiety', 'Stress Management', 'Mindfulness']),
      experience: 8,
      credentials: JSON.stringify(['MD Psychiatry', 'Mindfulness-Based Therapy Certified']),
      rating: 4.9,
      review_count: 203,
      availability: JSON.stringify(['Tuesday', 'Thursday', 'Saturday']),
      bio: 'Integrating traditional psychiatry with mindfulness-based approaches to help clients manage anxiety and stress.',
      languages: JSON.stringify(['en', 'hi'])
    },
    {
      name: 'Dr. Emily Chen',
      email: 'emily.chen@neuroscan.ai',
      specialization: JSON.stringify(['Depression', 'Bipolar Disorder', 'Family Therapy']),
      experience: 15,
      credentials: JSON.stringify(['PhD Clinical Psychology', 'Family Therapy Specialist', 'DBT Trained']),
      rating: 4.7,
      review_count: 189,
      availability: JSON.stringify(['Monday', 'Tuesday', 'Thursday']),
      bio: 'Experienced in treating mood disorders and providing family-centered therapeutic interventions.',
      languages: JSON.stringify(['en'])
    }
  ];
  
  for (const psych of psychologists) {
    await pool.query(
      `INSERT INTO psychologists (name, email, specialization, experience, credentials, rating, review_count, availability, bio, languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (email) DO NOTHING`,
      [psych.name, psych.email, psych.specialization, psych.experience, psych.credentials, 
       psych.rating, psych.review_count, psych.availability, psych.bio, psych.languages]
    );
  }
  
  console.log('✅ Sample psychologists inserted');
}

migrate();
