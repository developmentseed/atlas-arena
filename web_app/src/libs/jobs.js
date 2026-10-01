import axios from 'axios';
import { apiFetch } from '@/libs/api';

// Custom-data model runs on the atlasarena-model-infra API: POST jobs with the
// presence GeoJSON inline, then poll GET jobs/{id} until it finishes. On
// SUCCEEDED the job carries presigned COG URLs keyed by raster stem.

export const POLL_INTERVAL_MS = 5000;
export const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'UNKNOWN'];

const MIN_POINTS = 20;

// Fast settings (same as the model-infra demo frontend); the API defaults
// make for a multi-hour job.
const JOB_SETTINGS = {
  pseudo_absence: { n_replicates: 2, min_distance_km: 0 },
  sdm: { models: ['rf', 'et'], cv: 2, feature_selection_mode: 'none' },
  seed: 42,
};

// Scenario key (catalog.json time_frames) -> API scenario.
const API_SCENARIOS = { current: 'Current', ssp2: 'SSP2', ssp5: 'SSP5' };
export const isScenario = (key) => key in API_SCENARIOS;
const toScenario = (key) => API_SCENARIOS[key] || API_SCENARIOS.current;

// Job ids are 12 hex characters (atlasarena.config).
export const isJobId = (id) => /^[0-9a-f]{12}$/.test(id || '');

// Reads and checks a presence file; throws if the API would reject it.
export const readPresence = async (file) => {
  const fc = JSON.parse(await file.text());
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('Presence file is not a GeoJSON FeatureCollection');
  }
  const bad = fc.features.find(
    (f) => !['Point', 'MultiPoint'].includes(f && f.geometry && f.geometry.type)
  );
  if (bad) throw new Error('Presence features must be Points or MultiPoints');
  if (fc.features.length < MIN_POINTS) {
    throw new Error(`Presence needs at least ${MIN_POINTS} points`);
  }
  return { fc, pointCount: fc.features.length };
};

// Returns the new job's id.
export const submitJob = async ({
  species,
  scenario: scenarioKey,
  presence,
}) => {
  const scenario = toScenario(scenarioKey);
  // The API always needs Current; the future scenarios are modelled against it.
  const scenarios =
    scenario === 'Current' ? ['Current'] : ['Current', scenario];
  const { data } = await apiFetch('jobs', {
    method: 'POST',
    data: {
      species_name: species,
      presence,
      predictors: { scenarios },
      ...JOB_SETTINGS,
    },
  });
  return data.job_id;
};

// { job_id, status, species_name, error, presence_url, rasters, ... }
export const getJob = async (jobId) => {
  const { data } = await apiFetch(`jobs/${encodeURIComponent(jobId)}`);
  return data;
};

// Probability raster for the timeframe: stems are <species_slug>_<Scenario>
// (e.g. calomys_musculinus_SSP2), next to _diff_, _foi_ and _hotspots_ ones.
export const pickRaster = (rasters, scenarioKey) => {
  const suffix = `_${toScenario(scenarioKey)}`.toLowerCase();
  const stem = Object.keys(rasters || {}).find(
    (key) =>
      key.toLowerCase().endsWith(suffix) && !/_(diff|foi|hotspots)_/i.test(key)
  );
  return stem ? rasters[stem] : null;
};

// The presence GeoJSON behind a job's presigned presence_url. Plain axios: an
// Authorization header would make S3 reject the presigned request.
export const fetchPresence = async (url) => {
  const { data } = await axios.get(url);
  return data;
};
