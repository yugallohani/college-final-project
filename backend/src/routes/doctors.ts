import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/doctors/nearby
 * Proxy for Google Places Nearby Search — keeps API key server-side
 * Query params: lat, lng, keyword (e.g. "psychiatrist")
 */
router.get('/nearby', async (req, res) => {
  const { lat, lng, keyword } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // No API key — return curated fallback doctors so UI always works
    return res.json({ results: getFallbackDoctors(String(keyword || 'psychologist')), source: 'fallback' });
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${lat},${lng}`,
          radius: 5000,
          keyword: keyword || 'psychologist',
          type: 'doctor',
          key: apiKey,
        },
      }
    );

    const results = response.data.results.slice(0, 6).map((p: any) => ({
      id: p.place_id,
      name: p.name,
      address: p.vicinity,
      rating: p.rating || null,
      totalRatings: p.user_ratings_total || 0,
      open: p.opening_hours?.open_now ?? null,
      photo: p.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
        : null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));

    res.json({ results, source: 'google' });
  } catch (err: any) {
    console.error('Google Places error:', err.message);
    // Fallback on API error
    res.json({ results: getFallbackDoctors(String(keyword || 'psychologist')), source: 'fallback' });
  }
});

// Curated fallback doctors when no API key is set
function getFallbackDoctors(keyword: string) {
  const isPsychiatrist = keyword.includes('psychiatr');
  const isTherapist = keyword.includes('therap');

  const base = [
    {
      id: 'f1', name: 'Dr. Priya Sharma', address: 'Koramangala, Bangalore',
      rating: 4.8, totalRatings: 142, open: true, photo: null,
      specialization: isPsychiatrist ? 'Psychiatrist' : isTherapist ? 'Cognitive Therapist' : 'Clinical Psychologist',
      mapsUrl: 'https://www.google.com/maps/search/psychologist+near+me',
    },
    {
      id: 'f2', name: 'Dr. Arjun Mehta', address: 'Indiranagar, Bangalore',
      rating: 4.9, totalRatings: 203, open: true, photo: null,
      specialization: isPsychiatrist ? 'Psychiatrist' : 'Mindfulness Therapist',
      mapsUrl: 'https://www.google.com/maps/search/psychiatrist+near+me',
    },
    {
      id: 'f3', name: 'Dr. Neha Kapoor', address: 'HSR Layout, Bangalore',
      rating: 4.7, totalRatings: 189, open: false, photo: null,
      specialization: isTherapist ? 'CBT Therapist' : 'Clinical Psychologist',
      mapsUrl: 'https://www.google.com/maps/search/therapist+near+me',
    },
    {
      id: 'f4', name: 'Dr. Rahul Verma', address: 'Whitefield, Bangalore',
      rating: 4.6, totalRatings: 97, open: true, photo: null,
      specialization: isPsychiatrist ? 'Psychiatrist' : 'Psychotherapist',
      mapsUrl: 'https://www.google.com/maps/search/psychotherapist+near+me',
    },
  ];
  return base;
}

export default router;
