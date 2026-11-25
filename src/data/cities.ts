export interface IndianCity {
  id: string;
  name: string;
  hindiName: string;
  district?: string;
  state: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
  quickPick?: boolean;
  isCurrentLocation?: boolean;
}

export const QUICK_PICK_CITIES: IndianCity[] = [
  {
    id: 'delhi',
    name: 'Delhi',
    hindiName: 'दिल्ली',
    district: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    aliases: ['New Delhi', 'NCR', 'Dilli'],
    quickPick: true,
  },
  {
    id: 'jhansi',
    name: 'Jhansi',
    hindiName: 'झाँसी',
    district: 'Jhansi',
    state: 'Uttar Pradesh',
    latitude: 25.4484,
    longitude: 78.5685,
    aliases: ['Bundelkhand'],
    quickPick: true,
  },
  {
    id: 'gurugram',
    name: 'Gurugram',
    hindiName: 'गुरुग्राम',
    district: 'Gurugram',
    state: 'Haryana',
    latitude: 28.4595,
    longitude: 77.0266,
    aliases: ['Gurgaon', 'NCR'],
    quickPick: true,
  },
];

// Backward-compatible alias for defaults & tests
export const INDIAN_CITIES: IndianCity[] = QUICK_PICK_CITIES;
export const PRIMARY_QUICK_PICKS: IndianCity[] = QUICK_PICK_CITIES;

// Known Hindi Devanagari names to enrich live Open-Meteo geocoding results
export const HINDI_CITY_NAMES: Record<string, string> = {
  delhi: 'दिल्ली',
  'new delhi': 'नई दिल्ली',
  jhansi: 'झाँसी',
  gurugram: 'गुरुग्राम',
  gurgaon: 'गुरुग्राम',
  mumbai: 'मुंबई',
  bengaluru: 'बेंगलुरु',
  bangalore: 'बेंगलुरु',
  lucknow: 'लखनऊ',
  noida: 'नोएडा',
  ghaziabad: 'गाज़ियाबाद',
  faridabad: 'फरीदाबाद',
  jaipur: 'जयपुर',
  kanpur: 'कानपुर',
  varanasi: 'वाराणसी',
  agra: 'आगरा',
  prayagraj: 'प्रयागराज',
  allahabad: 'प्रयागराज',
  kolkata: 'कोलकाता',
  chennai: 'चेन्नई',
  hyderabad: 'हैदराबाद',
  pune: 'पुणे',
  ahmedabad: 'अहमदाबाद',
  patna: 'पटना',
  chandigarh: 'चंडीगढ़',
  bhopal: 'भोपाल',
  indore: 'इंदौर',
  amritsar: 'अमृतसर',
  meerut: 'मेरठ',
  gwalior: 'ग्वालियर',
  shimla: 'शिमला',
  dehradun: 'देहरादून',
  surat: 'सूरत',
  nagpur: 'नागपुर',
  ranchi: 'राँची',
  guwahati: 'गुवाहाटी',
  kochi: 'कोच्चि',
  udaipur: 'उदयपुर',
  jodhpur: 'जोधपुर',
  rampur: 'रामपुर',
  mathura: 'मथुरा',
  ayodhya: 'अयोध्या',
  gorakhpur: 'गोरखपुर',
  bareilly: 'बरेली',
  aligarh: 'अलीगढ़',
  moradabad: 'मुरादाबाद',
};

export function lookupHindiCityName(name: string): string {
  const normalized = name.trim().toLowerCase();
  return HINDI_CITY_NAMES[normalized] ?? name;
}

export function formatPlaceDisambiguation(place: {
  name: string;
  district?: string;
  state?: string;
}): string {
  const parts: string[] = [place.name.trim()];
  if (place.district && place.district.trim()) {
    parts.push(place.district.trim());
  }
  if (place.state && place.state.trim()) {
    parts.push(place.state.trim());
  }
  return parts.join(', ');
}

export function formatCoordinatesSubtitle(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(2)}° ${latDir}, ${Math.abs(longitude).toFixed(2)}° ${lonDir}`;
}

export interface ChecklistItemDef {
  id: string;
  title: string;
  detail: string;
  whyThisHelps: string;
  impactLabel: string;
}

export const LOW_EMISSION_ITEMS: ChecklistItemDef[] = [
  {
    id: 'transit',
    title: 'Take metro, city bus, or carpool instead of a solo car',
    detail: 'Use public transit or share rides along arterial office corridors.',
    whyThisHelps: 'Cuts per-commuter tailpipe PM2.5 and NO2 emissions by up to 75% and reduces roadside smog buildup.',
    impactLabel: 'High impact',
  },
  {
    id: 'no-burning',
    title: 'Avoid burning dry leaves, garden trimmings, or waste',
    detail: 'Compost or bag dry leaves for municipal collection instead of open burning.',
    whyThisHelps: 'Prevents acute local PM2.5 spikes and toxic benzene smoke that linger at breathing height across your lane.',
    impactLabel: 'Critical',
  },
  {
    id: 'off-peak',
    title: 'Schedule errands and travel during off-peak hours',
    detail: 'Plan trips outside 8:30–10:30 AM and 6:00–8:30 PM congestion windows.',
    whyThisHelps: 'Avoids idling traffic plumes where in-cabin and roadside ultrafine particulates can triple.',
    impactLabel: 'Medium impact',
  },
  {
    id: 'engine-off',
    title: 'Switch off vehicle engine at traffic signals over 30 seconds',
    detail: 'Turn off ignition at long urban intersections and railway crossings.',
    whyThisHelps: 'Cuts unnecessary idle exhaust right beside pedestrians, cyclists, and open-air two-wheeler riders.',
    impactLabel: 'Quick habit',
  },
  {
    id: 'batch-errands',
    title: 'Combine short market runs into one walk or e-rickshaw trip',
    detail: 'Group grocery, pharmacy, and neighborhood errands into a single loop.',
    whyThisHelps: 'Eliminates multiple cold-start engine emissions, which emit disproportionately high hydrocarbons and PM2.5.',
    impactLabel: 'Daily win',
  },
  {
    id: 'clean-energy',
    title: 'Use LPG, PNG, or induction cooking and avoid charcoal/wood',
    detail: 'Stick to clean kitchen fuels and electric heaters rather than biomass or coal.',
    whyThisHelps: 'Prevents heavy soot and carbon monoxide from accumulating indoors and drifting into neighboring flats.',
    impactLabel: 'High impact',
  },
];

export const INDOOR_HACK_ITEMS: ChecklistItemDef[] = [
  {
    id: 'ventilation-timing',
    title: 'Cross-ventilate only during today’s cleanest outdoor hours',
    detail: 'Open opposite windows briefly when outdoor AQI dips to its daytime low.',
    whyThisHelps: 'Flushes stale indoor CO2 and cooking fumes without pulling peak morning or evening smog into rooms.',
    impactLabel: 'Timing',
  },
  {
    id: 'wet-mopping',
    title: 'Wet mop floors instead of dry sweeping or dusting',
    detail: 'Use a damp microfiber mop or wet cloth rather than a dry broom (jhadu).',
    whyThisHelps: 'Traps settled PM10 road dust on the cloth instead of resuspending it back into lung height for hours.',
    impactLabel: 'PM10 control',
  },
  {
    id: 'shut-windows',
    title: 'Shut windows and seal door gaps before peak smog hours',
    detail: 'Close balcony sliders and place a draft stopper under main doors early.',
    whyThisHelps: 'Blocks outdoor haze trapped by evening temperature inversions from seeping into bedrooms overnight.',
    impactLabel: 'Smog barrier',
  },
  {
    id: 'kitchen-exhaust',
    title: 'Run kitchen chimney or exhaust fan while tadka and frying',
    detail: 'Switch on extraction before heating oil and keep it running 10 minutes after.',
    whyThisHelps: 'Prevents indoor PM2.5 from surging past 300 µg/m³ during high-heat Indian cooking and spreading to living areas.',
    impactLabel: 'Kitchen air',
  },
  {
    id: 'damp-wipe',
    title: 'Wipe window sills, AC filters, and fan blades with a damp cloth',
    detail: 'Clean mesh screens and fan edges weekly using wet cloths.',
    whyThisHelps: 'Removes trapped dust reservoirs so ceiling fans and AC airflow do not continuously recirculate irritants.',
    impactLabel: 'Maintenance',
  },
  {
    id: 'bedroom-clean-zone',
    title: 'Keep one bedroom as a sealed low-PM sleep zone',
    detail: 'Close the bedroom door before dusk and run a HEPA purifier on medium if available.',
    whyThisHelps: 'Gives lungs 7–8 hours of low-particulate recovery overnight, lowering morning throat irritation and wheezing.',
    impactLabel: 'Sleep recovery',
  },
];
