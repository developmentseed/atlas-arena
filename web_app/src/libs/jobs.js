import axios from 'axios';
import { zipSync } from 'fflate';
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

// Scenario key (catalog.json time_frames) -> API scenario. Delta keys show the
// future scenario's difference from Current.
const API_SCENARIOS = { current: 'Current', ssp2: 'SSP2', ssp5: 'SSP5' };
const DELTA_SCENARIOS = { delta_ssp2: 'SSP2', delta_ssp5: 'SSP5' };
export const SCENARIO_KEYS = [
  ...Object.keys(API_SCENARIOS),
  ...Object.keys(DELTA_SCENARIOS),
];
export const isScenario = (key) => SCENARIO_KEYS.includes(key);
export const isDeltaScenario = (key) => key in DELTA_SCENARIOS;
const toScenario = (key) =>
  API_SCENARIOS[key] || DELTA_SCENARIOS[key] || API_SCENARIOS.current;

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
  // The layer name (e.g. 'abrothrix_longipilis_(waterhouse_1837)_presence'),
  // used to pre-select the species.
  const layerName = fc.name || fc.features[0]?.properties?.name || null;
  return { fc, pointCount: fc.features.length, layerName };
};

// Returns the new job's id. pathogens is the API's foi.pathogens
// ([{ virus, prevalence, k_min, k_max }], see libs/foiParams); force of
// infection runs for those, and is off when there are none. The API fills in
// the population rasters from the deployment's defaults. Leaves out
// predictors.scenarios: the API defaults to all of Current, SSP2 and SSP5,
// which the scenario switcher flips between.
export const submitJob = async ({ species, presence, pathogens = [] }) => {
  const { data } = await apiFetch('jobs', {
    method: 'POST',
    data: {
      species_name: species,
      presence,
      ...JOB_SETTINGS,
      foi: pathogens.length ? { enabled: true, pathogens } : { enabled: false },
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
// Delta keys pick <species_slug>_diff_<Scenario>_minus_current.
export const pickRaster = (rasters, scenarioKey) => {
  const scenario = toScenario(scenarioKey).toLowerCase();
  const stem = Object.keys(rasters || {}).find((key) => {
    const lower = key.toLowerCase();
    if (isDeltaScenario(scenarioKey)) {
      return lower.endsWith(`_diff_${scenario}_minus_current`);
    }
    return (
      lower.endsWith(`_${scenario}`) && !/_(diff|foi|hotspots)_/.test(lower)
    );
  });
  return stem ? rasters[stem] : null;
};

// The scenario keys a job has a probability raster for. Jobs submitted before
// every run covered all three scenarios may only have some.
export const jobScenarios = (rasters) =>
  SCENARIO_KEYS.filter((key) => pickRaster(rasters, key));

// FOI outputs for the timeframe, one entry per virus the species has FOI
// parameters for: stems are <species_slug>__<virus_slug>_foi_<scenario> and
// ..._hotspots_<scenario>. Returns [{ virusSlug, foi, hotspots }] (URLs).
// There are no FOI differences: delta keys get their future scenario's.
export const foiRasters = (rasters, scenarioKey) => {
  const scenario = toScenario(scenarioKey).toLowerCase();
  const pattern = new RegExp(`^(.*)__(.+?)_(foi|hotspots)_${scenario}$`);
  const byVirus = {};
  Object.entries(rasters || {}).forEach(([stem, url]) => {
    const match = stem.toLowerCase().match(pattern);
    if (!match) return;
    const [, , virusSlug, kind] = match;
    byVirus[virusSlug] = { virusSlug, ...byVirus[virusSlug], [kind]: url };
  });
  return Object.values(byVirus);
};

// The presence GeoJSON behind a job's presigned presence_url. Plain axios: an
// Authorization header would make S3 reject the presigned request.
export const fetchPresence = async (url) => {
  const { data } = await axios.get(url);
  return data;
};

// Saves every raster of a succeeded job as one zip,
// atlasarena_<species_slug>_<job_id>.zip with a <stem>.tif per raster. Gets
// the job again for fresh presigned URLs (they expire), and fetches them with
// plain axios like fetchPresence. The COGs are already DEFLATE-compressed, so
// the zip only stores them.
export const downloadJobRasters = async (jobId) => {
  const job = await getJob(jobId);
  const rasters = Object.entries(job.rasters || {});
  if (!rasters.length) throw new Error('This job has no rasters');
  const files = Object.fromEntries(
    await Promise.all(
      rasters.map(async ([stem, url]) => {
        const { data } = await axios.get(url, { responseType: 'arraybuffer' });
        return [`${stem}.tif`, new Uint8Array(data)];
      })
    )
  );
  const zipped = zipSync(files, { level: 0 });
  const slug = (job.species_name || 'species')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const href = URL.createObjectURL(
    new Blob([zipped], { type: 'application/zip' })
  );
  const link = document.createElement('a');
  link.href = href;
  link.download = `atlasarena_${slug}_${jobId}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after the click has handed the blob to the browser's download.
  setTimeout(() => URL.revokeObjectURL(href), 0);
};
