import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  getCommuteLabel,
  getHomeTypeLabel,
  validateFamilyProfile,
  type FamilyProfile,
  type MemberDailyPlan,
  type PersonalizedFamilyPlan,
} from './src/utils/familyPlan.ts';
import { getAqiBand } from './src/utils/aqi.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface FamilyPlanRequestBody {
  city: {
    name: string;
    hindiName: string;
    state: string;
  };
  airQuality: {
    usAqi: number;
    pm25: number;
    pm10: number;
    bestWindowLabel: string | null;
    bestWindowAvgAqi: number | null;
    worstWindowLabel: string | null;
    worstWindowAvgAqi: number | null;
    hourlyForecastText: string;
  };
  familyProfile: FamilyProfile;
}

const familyPlanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: 'One crisp, reassuring action headline for this household today.',
    },
    householdRiskLevel: {
      type: Type.STRING,
      description: 'Short plain-text risk summary (e.g., High Care for Child & Asthmatic Senior).',
    },
    householdWhyThisHelps: {
      type: Type.STRING,
      description: 'One short sentence explaining the main health benefit or pollution avoided by following today’s coordinated plan.',
    },
    hindiAudioSummary: {
      type: Type.STRING,
      description:
        'A clear, warm spoken-style summary in natural Devanagari Hindi (4 to 6 concise sentences) ready to be read aloud by a hi-IN voice. Mention the city name in Hindi, today’s AQI, each family member’s best hours to go out, mask advice, and top indoor air tip.',
    },
    memberPlans: {
      type: Type.ARRAY,
      description:
        'An individual personalized plan for EACH family member listed in the profile (one object per person).',
      items: {
        type: Type.OBJECT,
        properties: {
          memberLabel: {
            type: Type.STRING,
            description: 'Specific person label with age (e.g., Child (Age 8), Adult 1 (Age 36), Adult 2 (Age 39), Senior (Age 68)).',
          },
          riskTag: {
            type: Type.STRING,
            description: 'Short sensitivity summary for this member (e.g., Developing Lungs, Commuter, Asthmatic Senior).',
          },
          bestHours: {
            type: Type.OBJECT,
            properties: {
              recommendedWindow: { type: Type.STRING, description: 'Specific clock hours from today’s forecast (e.g., 12 PM – 3 PM).' },
              avoidWindow: { type: Type.STRING, description: 'Peak pollution hours to avoid (e.g., 6 AM – 9 AM & 8 PM – 11 PM).' },
              guidance: { type: Type.STRING, description: 'Practical outdoor timing instruction for this person.' },
              whyThisHelps: { type: Type.STRING, description: 'Short explanation of the health benefit or pollution avoided.' },
            },
            required: ['recommendedWindow', 'avoidWindow', 'guidance', 'whyThisHelps'],
          },
          lowEmissionRoutine: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              whyThisHelps: { type: Type.STRING, description: 'Short explanation of the pollution avoided or exposure reduced.' },
            },
            required: ['title', 'detail', 'whyThisHelps'],
          },
          indoorAirHack: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              whyThisHelps: { type: Type.STRING, description: 'Short explanation of the indoor particulate reduction or lung benefit.' },
            },
            required: ['title', 'detail', 'whyThisHelps'],
          },
          maskAndExercise: {
            type: Type.OBJECT,
            properties: {
              maskType: { type: Type.STRING, description: 'Exact mask grade/fit (e.g., Kid-sized KN95, Fitted N95/FFP2, None needed).' },
              maskWhen: { type: Type.STRING, description: 'When this member should wear the mask.' },
              exerciseGuidance: { type: Type.STRING, description: 'Safe outdoor or indoor exercise plan for this person today.' },
              whyThisHelps: { type: Type.STRING, description: 'Short explanation of the respiratory health benefit.' },
            },
            required: ['maskType', 'maskWhen', 'exerciseGuidance', 'whyThisHelps'],
          },
        },
        required: [
          'memberLabel',
          'riskTag',
          'bestHours',
          'lowEmissionRoutine',
          'indoorAirHack',
          'maskAndExercise',
        ],
      },
    },
  },
  required: [
    'headline',
    'householdRiskLevel',
    'householdWhyThisHelps',
    'hindiAudioSummary',
    'memberPlans',
  ],
};

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  maxAttempts = 2
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are SaafHawa, a practical Indian urban air quality and respiratory health planner. ' +
            'Generate a dedicated, realistic daily plan for EACH individual member in the household—never merge different ages together into a single card when distinct ages are provided. ' +
            'Ground every timing window in the actual live AQI and hourly forecast data provided. Tailor advice to Indian cities (metro/bus/scooter commutes, school timings, kitchen tadka exhaust, wet mopping, balcony doors, kid-sized KN95/N95 masks, asthma/elderly care). ' +
            'Every single suggestion MUST include a concise, informative whyThisHelps line explaining the concrete health benefit or pollution avoided. Return strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: familyPlanResponseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/family-plan', async (req, res) => {
    try {
      const body = req.body as Partial<FamilyPlanRequestBody>;
      if (!body?.city?.name || !body?.airQuality || !body?.familyProfile) {
        res.status(400).json({
          error: 'Please choose a city and fill in your family details before generating a plan.',
        });
        return;
      }

      const validation = validateFamilyProfile(body.familyProfile);
      if (!validation.valid) {
        const firstErr = Object.values(validation.errors)[0] ?? 'Please check your family details.';
        res.status(400).json({ error: firstErr });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'AI planning is temporarily unavailable because the Gemini API key is not configured yet. Please check Settings > Secrets.',
        });
        return;
      }

      const { city, airQuality, familyProfile } = body;
      const band = getAqiBand(airQuality.usAqi);
      const breathingList =
        familyProfile.breathingIssues.length > 0
          ? familyProfile.breathingIssues.join(', ')
          : 'None reported';

      const targetMemberCount = Math.min(
        8,
        Math.max(validation.parsedAges.length, familyProfile.memberCount)
      );

      const prompt = [
        `Create an individual daily air-quality action plan for EACH member of a family in ${city.name} (${city.hindiName}), ${city.state}, India.`,
        '',
        'LIVE AIR QUALITY & HOURLY FORECAST:',
        `- Current US AQI: ${airQuality.usAqi} (${band.label})`,
        `- Current PM2.5: ${airQuality.pm25} µg/m³ | PM10: ${airQuality.pm10} µg/m³`,
        `- Cleanest 3h daytime window today: ${airQuality.bestWindowLabel ?? 'Midday'} (Avg AQI ~${airQuality.bestWindowAvgAqi ?? airQuality.usAqi})`,
        `- Peak smog window today: ${airQuality.worstWindowLabel ?? 'Evening/early morning'} (Avg AQI ~${airQuality.worstWindowAvgAqi ?? airQuality.usAqi})`,
        `- Full Hourly Forecast (Today & Tomorrow):`,
        airQuality.hourlyForecastText || `Current AQI ${airQuality.usAqi}`,
        '',
        'FAMILY PROFILE:',
        `- Number of people: ${familyProfile.memberCount}`,
        `- Individual ages: ${familyProfile.ages} (generate ${targetMemberCount} distinct memberPlans entries—one for each person)`,
        `- Kids (under 12): ${familyProfile.hasKids ? 'Yes' : 'No'} | Elderly (60+): ${familyProfile.hasElderly ? 'Yes' : 'No'}`,
        `- Asthma or breathing issues: ${breathingList}`,
        familyProfile.breathingNotes.trim()
          ? `- Additional family notes: ${familyProfile.breathingNotes.trim()}`
          : '',
        `- Primary commute: ${getCommuteLabel(familyProfile.commuteType)}`,
        `- Home type: ${getHomeTypeLabel(familyProfile.homeType)}`,
        '',
        'CRITICAL OUTPUT RULES:',
        `1. Produce ${targetMemberCount} individual entries in memberPlans—one dedicated card per person so every age has tailored guidance.`,
        '2. Each member card must cover: bestHours (using exact hours from the hourly forecast above), lowEmissionRoutine, indoorAirHack (specific to their home type), and maskAndExercise.',
        '3. Every single sub-section must include a concise, concrete whyThisHelps sentence explaining the health benefit or pollution avoided.',
        '4. Also write hindiAudioSummary in natural, easy-to-understand Devanagari Hindi (using Hindi words and simple numbers) summarizing today’s AQI and key guidance for each family member so it sounds great when read aloud with a hi-IN voice.',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await callGeminiWithRetry(ai, prompt);
      const rawText = (response.text ?? '').trim();

      if (!rawText) {
        res.status(502).json({
          error: 'Gemini sent back an empty response. Please try generating your family plan again.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        headline: string;
        householdRiskLevel: string;
        householdWhyThisHelps: string;
        hindiAudioSummary?: string;
        memberPlans: MemberDailyPlan[];
      };

      const plan: PersonalizedFamilyPlan = {
        cityName: city.name,
        cityHindiName: city.hindiName,
        aqiAtGeneration: airQuality.usAqi,
        generatedAt: new Date().toISOString(),
        headline: parsed.headline,
        householdRiskLevel: parsed.householdRiskLevel,
        householdWhyThisHelps: parsed.householdWhyThisHelps,
        hindiAudioSummary: parsed.hindiAudioSummary,
        memberPlans: Array.isArray(parsed.memberPlans) ? parsed.memberPlans : [],
      };

      res.json({ plan });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to generate personalized family plan.';
      console.error('[/api/family-plan] Gemini error:', message);

      if (
        message.includes('API_KEY_INVALID') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403')
      ) {
        res.status(403).json({
          error:
            'Your Gemini API key could not be verified. Please double-check it in Settings > Secrets and try again.',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error:
            'We hit a brief rate limit with Gemini. Wait a few seconds and click Try Again.',
        });
        return;
      }

      res.status(500).json({
        error:
          'We couldn’t reach Gemini right now to build your family plan. Please check your connection and try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SaafHawa server running at http://localhost:${PORT}`);
  });
}

startServer();
