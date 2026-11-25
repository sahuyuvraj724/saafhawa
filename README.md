# SaafHawa — Urban Air Quality Assistant for Indian Cities

**SaafHawa (साफ़ हवा)** is a mobile-friendly urban air quality assistant built for Indian cities. It combines live Open-Meteo AQI & hourly forecasts with practical checklists and a Gemini-powered **My Family** planner so households get individual, evidence-backed daily guidance—complete with a short **"Why this helps"** explanation under every recommendation.

---

## The Problem

Residents across Indian cities—from Delhi NCR and Gurugram to Tier-2 hubs like Jhansi, Lucknow, and Jaipur—frequently see a single daily AQI number without knowing how to translate it into safe decisions for everyone at home:

- **Static numbers hide hourly shifts:** Air quality swings sharply between morning/evening inversion spikes and afternoon dispersion, yet most apps bury the cleanest windows for today and tomorrow.
- **One-size-fits-all advice misses family differences:** An 8-year-old heading to a school bus, two adult commuters, and a 68-year-old with asthma in the same flat need distinct outdoor timing, mask grades, and exercise boundaries.
- **Recommendations feel arbitrary without context:** People are far more likely to follow low-emission commutes, timed ventilation, and wet mopping when every step clearly explains the health benefit or pollution avoided.

---

## Key Features

1. **Live Air Quality for Any Place in India, Location Detection & Cigarette Equivalence Card**
   - Debounced pan-India place search powered by the free Open-Meteo Geocoding API (`count=8&countryCode=IN&language=en`) showing suggestions as **“City, District, State”** to disambiguate same-name towns, with friendly empty-state feedback if no place matches.
   - One-tap **Use my location** button using browser geolocation + cached OpenStreetMap Nominatim reverse geocoding (`zoom=14&accept-language=en`) to show **“Area, City, State”** (falling back cleanly to **“Near you (lat, lon)”** if reverse lookup fails) and fetch live AQI for those exact coordinates.
   - Quick picks for **Delhi · दिल्ली**, **Jhansi · झाँसी**, and **Gurugram · गुरुग्राम**, plus automatic memory of your **last searched city** in `localStorage`.
   - Displays a large colour-coded US AQI number, piecewise-aligned 6-band scale indicator, **PM2.5** and **PM10** (`µg/m³`) vs. WHO 24-hour guidelines, a **“Today’s air = X cigarettes”** card (Berkeley Earth estimate: `PM2.5 ÷ 22`, rounded to one decimal, with health context), a one-line health takeaway, and a 3-day AQI outlook.
2. **Today & Tomorrow Hourly AQI Charts with Cleanest Hours Highlighted**
   - Displays interactive 24-hour US AQI bar charts for **both Today and Tomorrow** (plus single-day focus tabs), highlighting each day’s cleanest 3-hour daytime outdoor window in green and showing PM2.5 and band details on hover or tap.
3. **My Family — Per-Member AI Daily Plan (Gemini) & Listen in Hindi**
   - Captures household size, individual ages, kids/elderly flags, asthma or breathing sensitivities, commute type, and home type.
   - Sends live AQI, PM2.5/PM10, and the full Today & Tomorrow hourly forecast along with the family profile to Gemini to generate an **individual card for each member** covering:
     - **Best hours to go out** (and peak smog hours to avoid)
     - **Low-emission daily routine**
     - **Indoor air hacks** tailored to their home type
     - **Mask + exercise advice**
   - Includes a **Listen in Hindi** button (with a **Stop** button) that reads the family’s personalized plan aloud in natural Hindi using the browser’s built-in `speechSynthesis` (`hi-IN` voice).
4. **“Why This Helps” Under Every Suggestion**
   - Every AI per-member recommendation, every Low-Emission Day Planner habit, every Indoor AQI Hack, and every Mask & Exercise guideline includes a short **Why this helps** line explaining the health benefit or particulate pollution avoided.
5. **Persistent Checklists, Loading States & Friendly Error Recovery**
   - Interactive **Low-Emission Day Planner** and **Indoor AQI Hacks** checklists saved to `localStorage`, forecast-synced ventilation timing, accessible loading skeletons, and friendly error banners with one-click **Try Again** recovery if either Open-Meteo or Gemini fails.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide icons, Vite
- **Backend:** Express (`server.ts`) mounting Vite dev middleware and server-side API endpoints
- **Live Air Quality & Geocoding Data:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (`current=us_aqi,pm2_5,pm10`, `hourly=pm2_5,us_aqi`, `forecast_days=3`, no API key required), Open-Meteo Geocoding API, and OpenStreetMap Nominatim reverse geocoding
- **AI Personalization:** `@google/genai` SDK calling `gemini-3.1-flash-lite` on the server (`POST /api/family-plan`)
- **Testing & Accessibility:** Vitest + React Testing Library (`npm test`) covering AQI bands, cigarette equivalence, cleanest hours, trend vs. previous hour, mocked Open-Meteo/Nominatim APIs, and core UI components; built to WCAG 2.1 AA standards (semantic landmarks, skip link, `aria-live` AQI announcements, keyboard navigation, high contrast, and `prefers-reduced-motion` support)

---

## How Gemini Is Used

1. **Server-Side Endpoint (`/server.ts`):** All `@google/genai` calls run strictly on the Express backend via `POST /api/family-plan` using `process.env.GEMINI_API_KEY`, keeping credentials off the client.
2. **Live AQI + Hourly Forecast Grounding:** Each request sends today’s live US AQI, PM2.5, PM10, computed cleanest/peak windows, and the complete Today & Tomorrow hourly forecast (`formatHourlyForecastForPrompt`) alongside the household’s exact ages, breathing conditions, commute mode, and home type.
3. **Structured Per-Member JSON Schema (`responseSchema`):** Gemini (`gemini-3.1-flash-lite`, `ThinkingLevel.MINIMAL`) is constrained with an explicit `@google/genai` `Type` JSON schema (`responseMimeType: "application/json"`) so it returns one structured card per family member (`memberPlans[]`) with mandatory `whyThisHelps` explanations for every single suggestion.
4. **Resilient Error Handling:** The server retries transient upstream errors and returns friendly, actionable messages (HTTP 400/403/429/500/503) rendered directly in the UI with a **Try Again** button—never masking API failures with fake AI output.
