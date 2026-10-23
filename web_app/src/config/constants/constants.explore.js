// ======
// SIDEBAR
// ======

export const SIDEBAR_TITLE = 'EXPLORE';
export const SIDEBAR_SUBTITLE = 'Explore the risk of Arenaviruses';
export const FILTERS_SHOW = 'Show filters';
export const FILTERS_HIDE = 'Hide filters';

// VIRUS FILTER
export const VIRUS_LABEL = 'virus';
export const VIRUS_INFO = 'virus';

// SCENARIOS
export const TIMEFRAME_LABEL = 'Climate Scenarios';
export const TIMEFRAME_INFO = 'Shared Socio-economic Pathways (SSPs)';

// RODENT DISTRIBUTION
export const SDM_TOGGLE_LABEL = 'Show Species Distribution Maps';

// SPECIES
export const SPECIES_LABEL = 'Reservoir Species';
export const SPECIES_INFO = 'species';

// MODEL
export const MODEL_LABEL = 'model algorithm';
export const MODEL_INFO = 'model';

// LEGEND
export const LEGEND_OPACITY = 'Opacity';
export const LEGEND_OPACITY_OF = (name = '') => `${LEGEND_OPACITY} of ${name}`;
export const LEGEND_ADJUST_OPACITY = (name = '') => `Adjust opacity of ${name}`;
export const LEGEND_SCALE = (min = '', max = '') =>
  `Scale from ${min} to ${max}.`;
export const LEGEND_SDM_TITLE = 'Species distribution';
export const LEGEND_HOTSPOT_TITLE = 'Viral hotspot probability';
export const LEGEND_HOTSPOT_DESC =
  '90th percentile of contacts between humans and rodents';

export const UNIT_SDM = 'probability';
export const UNIT_DELTA = 'change';

// SIDEBAR TABS
export const TAB_EXPLORE = 'Explore Models';
export const TAB_RUN = 'Run Models';
export const TAB_RUN_SIGNED_OUT = 'Log in to run custom models';

// RUN MODELS (custom data upload and model run)
export const CUSTOM_DATA_NOTICE = (species = '') =>
  `Results for ${species} are based on your uploaded data`;
export const RUN_DESCRIPTION =
  "Upload presence points for one species. Points are linked to known zoonotic hantaviruses and arenaviruses to generate species distribution models (SDMs) and force-of-infection (FOI) hazard layers.";
export const RUN_STEP_UPLOAD = 'Upload presence data';
export const RUN_SINGLE_SPECIES = 'Please upload a single species only.';
export const RUN_STEP_SPECIES = 'Species';
export const RUN_STEP_PATHOGEN = 'Pathogen association';
export const RUN_PATHOGEN_BADGE = 'Auto-selected';
export const RUN_SPECIES_LOADING = 'Loading species…';
export const RUN_SPECIES_ERROR_TITLE = 'Couldn’t load species list';
export const RUN_SPECIES_ERROR_TEXT =
  'Species and pathogen parameters are unavailable. Reload the page to try again.';
export const RUN_STEP_MODEL = 'Model';
export const RUN_SUBMIT = 'Run Model';
export const RUN_IN_PROGRESS = 'Running model…';
export const RUN_SERVER_NOTICE =
  'Model inferencing runs on the server. You can close your browser or navigate away from this tab.';
export const UPLOAD_DROPZONE_TEXT = 'Drag & drop a GeoJSON file here';
export const UPLOAD_DROPZONE_BROWSE = 'or browse files';
export const UPLOAD_DROPZONE_HINT =
  'Single species · [lon, lat] points · EPSG:4326';
export const UPLOAD_DROPZONE_LABEL = `Upload presence data: ${UPLOAD_DROPZONE_TEXT} ${UPLOAD_DROPZONE_BROWSE}`;
export const UPLOAD_FILE_DETAILS = (count) =>
  count == null
    ? 'EPSG:4326'
    : `${count.toLocaleString('en-US')} points · EPSG:4326`;
export const UPLOAD_REMOVE_FILE = 'Remove file';
export const UPLOAD_ACCEPT = '.geojson,.json,application/geo+json';
export const UPLOAD_IN_PROGRESS = 'Uploading presence data';
export const UPLOAD_ERROR_TITLE = 'Upload failed';
export const UPLOAD_ERROR_TEXT = 'We couldn’t process this file.';
export const MAP_POINTS_EMPTY =
  'Your uploaded presence points will appear here';
export const MAP_POINTS_LOADED = (count = 0) =>
  `${count.toLocaleString('en-US')} presence points loaded`;
export const RESULTS_DESCRIPTION =
  'Results for the data you uploaded. Switch climate scenarios to see projected change.';
export const SHARED_RESULTS_DESCRIPTION =
  'Results of a shared model run. Switch climate scenarios to see projected change.';
export const RESULTS_SPECIES_LABEL = 'Uploaded species';
export const RESULTS_POINTS = (count = 0) =>
  `${count.toLocaleString('en-US')} presence points`;
export const MAP_LAYERS_LABEL = 'Map layers';
export const UPLOAD_NEW_DATASET = 'Upload new dataset';
export const DOWNLOAD_RESULTS = 'Download results';
export const DOWNLOAD_ERROR_TITLE = 'Download failed';
export const DOWNLOAD_ERROR_TEXT =
  'We couldn’t download the results. Please try again.';
// CUSTOM JOB STATUS (sidebar, while custom data is loaded)
export const JOB_STATUS_TEXT = {
  LOADING: 'Loading model run',
  SUBMITTED: 'Queued: waiting for the model to start',
  RUNNING: 'Model running: this can take a few minutes',
  SUCCEEDED: 'Results ready',
};
export const SHOW_POINTS_LABEL = 'Show uploaded presence points';
export const SHOW_FOI_LABEL = 'Show Force of Infection';
export const LEGEND_FOI_TITLE = 'Force of infection';
export const LEGEND_FOI_TICKS = ['0', '0.025', '0.05'];
export const JOB_NOT_AVAILABLE_TITLE = 'Results not available yet';
export const JOB_NOT_AVAILABLE_TEXT =
  'This model run hasn’t finished, or the link is wrong. Check back later.';
export const JOB_FAILED_TITLE = 'Model run failed';
export const JOB_NOT_FOUND_TITLE = 'Model run not found';

// MAP
export const MAP_REGION_LABEL = 'Arenavirus risk map';
// MODAL

export const FIRST_LINE_MODAL = 'About the virus';
