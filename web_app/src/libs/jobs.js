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

// Timeframe display name (catalog.json time_frames) -> API scenario.
const toScenario = (timeFrame = '') => {
  const name = timeFrame.toLowerCase();
  if (name.startsWith('ssp 2')) return 'SSP2';
  if (name.startsWith('ssp 5')) return 'SSP5';
  return 'Current';
};

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
export const submitJob = async ({ species, timeFrame, presence }) => {
  const scenario = toScenario(timeFrame);
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

// { job_id, status, error, rasters: { stem: url } | null, ... }
export const getJob = async (jobId) => {
  const { data } = await apiFetch(`jobs/${encodeURIComponent(jobId)}`);
  return data;
};

// Probability raster for the timeframe: stems are <species_slug>_<Scenario>
// (e.g. calomys_musculinus_SSP2), next to _diff_, _foi_ and _hotspots_ ones.
export const pickRaster = (rasters, timeFrame) => {
  const suffix = `_${toScenario(timeFrame)}`.toLowerCase();
  const stem = Object.keys(rasters || {}).find(
    (key) =>
      key.toLowerCase().endsWith(suffix) && !/_(diff|foi|hotspots)_/i.test(key)
  );
  return stem ? rasters[stem] : null;
};
