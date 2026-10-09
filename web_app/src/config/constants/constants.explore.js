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
export const LEGEND_SDM_TITLE = 'Species distribution';
export const LEGEND_HOTSPOT_TITLE = 'Viral hotspot probability';
export const LEGEND_HOTSPOT_DESC =
  '90th percentile of contacts between humans and rodents';

export const UNIT_SDM = 'probability';
export const UNIT_DELTA = 'change';

// UPLOAD MODAL
export const UPLOAD_BUTTON = 'Upload presence data';
export const CLEAR_CUSTOM_DATA_BUTTON = 'Clear custom data';
export const CUSTOM_DATA_NOTICE = (species = '') =>
  `Results for ${species} are based on your uploaded data`;
export const UPLOAD_TITLE = 'Upload species presence data';
export const UPLOAD_DESCRIPTION =
  'Upload custom data to run AtlasArena models for your data. Custom data replaces GBIF presence data.';
export const UPLOAD_SCENARIO_LABEL = 'Scenario';
export const UPLOAD_SPECIES_LABEL = 'Species';
export const UPLOAD_DROPZONE_TEXT =
  'Drop a GeoJSON file here, or click to upload';
export const UPLOAD_DROPZONE_HINT =
  'Point features with longitude/latitude coordinates (.geojson or .json)';
export const UPLOAD_ACCEPT = '.geojson,.json,application/geo+json';
export const UPLOAD_CANCEL = 'Cancel';
export const UPLOAD_SUBMIT = 'Upload';
export const UPLOAD_SUCCESS_TITLE = 'Upload successful';
export const UPLOAD_SUCCESS_TEXT = (count = 0) =>
  `${count.toLocaleString('en-US')} points uploaded`;
export const UPLOAD_DONE = 'Done';
export const UPLOAD_ERROR_TITLE = 'Upload failed';
export const UPLOAD_ERROR_TEXT = 'We couldn’t process this file.';
export const UPLOAD_RETRY = 'Choose a different file';
// CUSTOM JOB STATUS (sidebar, while custom data is loaded)
export const JOB_STATUS_TEXT = {
  LOADING: 'Loading model run',
  SUBMITTED: 'Queued: waiting for the model to start',
  RUNNING: 'Model running: this can take a few minutes',
  SUCCEEDED: 'Results ready',
};
export const SHOW_POINTS_LABEL = 'Show uploaded points';
export const SHOW_FOI_LABEL = 'Show force of infection';
export const LEGEND_FOI_TITLE = 'Force of infection';
export const LEGEND_FOI_TICKS = ['0', '0.025', '0.05'];
export const SIGN_IN_TO_VIEW_JOB = 'Sign in to view this model run';
export const JOB_FAILED_TITLE = 'Model run failed';
export const JOB_NOT_FOUND_TITLE = 'Model run not found';

// MODAL

export const FIRST_LINE_MODAL = 'About the virus';
