import { useCallback, useEffect, useRef, useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { useAuth } from '@/store/auth';
import { setHashParams, useHashParams } from '@/libs/hashParams';
import { findVirus, timeFrameKey, timeFrameName } from '@/libs/catalog';
import {
  POLL_INTERVAL_MS,
  TERMINAL_STATUSES,
  fetchPresence,
  foiRasters,
  getJob,
  isJobId,
  isScenario,
  pickRaster,
  readPresence,
  submitJob,
} from '@/libs/jobs';
import {
  JOB_FAILED_TITLE,
  JOB_NOT_FOUND_TITLE,
  SIGN_IN_TO_VIEW_JOB,
} from '@/config/constants/constants.explore';

const SIGN_IN_TOAST_ID = 'sign-in-to-view-job';

// The custom-data model run shown on Explore. The URL fragment is the source
// of truth (#job=<id>&scenario=<time_frames key>): uploading pushes it,
// clearing removes it, and loading, reloading, shared links and Back/Forward
// all just follow it. Jobs need a signed-in user to read.
export const useCustomJob = () => {
  const { job: jobParam, scenario: scenarioParam } = useHashParams();
  const { status: authStatus, enabled: authEnabled } = useAuth();

  const jobId = jobParam || null;
  const scenario = isScenario(scenarioParam) ? scenarioParam : 'current';
  const active = Boolean(jobId) && authStatus === 'signedIn';

  // Latest GET jobs/{id} response for jobId; null until the first arrives.
  const [job, setJob] = useState(null);
  // { jobId, fc }: points uploaded in this tab, or fetched via presence_url.
  const [presence, setPresence] = useState(null);
  const presenceRef = useRef(presence);
  presenceRef.current = presence;
  const [showPoints, setShowPoints] = useState(true);
  const [showFoi, setShowFoi] = useState(true);
  // Points of the file picked in the upload modal, before it's submitted.
  const [previewFc, setPreviewFc] = useState(null);
  const previewFileRef = useRef(null);

  // Toast, then drop the job from the URL (replace: the link was bad).
  const dropJob = useCallback((title, description) => {
    toaster.create({
      type: 'error',
      title,
      description,
      closable: true,
      duration: 8000,
    });
    setHashParams({ job: null, scenario: null });
  }, []);

  // A linked job needs signing in: prompt until signed in, dismissed, or the
  // job leaves the URL.
  useEffect(() => {
    if (!jobId || !authEnabled || authStatus !== 'signedOut') return;
    if (!toaster.isVisible(SIGN_IN_TOAST_ID)) {
      toaster.create({
        id: SIGN_IN_TOAST_ID,
        type: 'info',
        title: SIGN_IN_TO_VIEW_JOB,
        closable: true,
        duration: Infinity,
      });
    }
    return () => toaster.dismiss(SIGN_IN_TOAST_ID);
  }, [jobId, authEnabled, authStatus]);

  useEffect(() => {
    setShowPoints(true);
    setShowFoi(true);
  }, [jobId]);

  useEffect(() => {
    setJob(null);
    if (!active) return;
    if (!isJobId(jobId)) {
      dropJob(JOB_NOT_FOUND_TITLE);
      return;
    }
    let cancelled = false;
    let timer = null;
    let presenceRequested = false;

    const loadPresence = (url) => {
      presenceRequested = true;
      if (presenceRef.current?.jobId === jobId) return;
      fetchPresence(url)
        .then((fc) => {
          if (!cancelled) setPresence({ jobId, fc });
        })
        .catch(console.error);
    };

    const poll = async () => {
      let data;
      try {
        data = await getJob(jobId);
      } catch (err) {
        if (cancelled) return;
        clearInterval(timer);
        const status = err.response?.status;
        // apiFetch has signed out; keep the link for after signing back in.
        if (status === 401) return;
        if (status === 404) dropJob(JOB_NOT_FOUND_TITLE);
        else
          dropJob(JOB_FAILED_TITLE, err.response?.data?.detail || err.message);
        return;
      }
      if (cancelled) return;
      if (TERMINAL_STATUSES.includes(data.status)) clearInterval(timer);
      if (data.presence_url && !presenceRequested)
        loadPresence(data.presence_url);
      if (data.status === 'FAILED' || data.status === 'UNKNOWN') {
        dropJob(JOB_FAILED_TITLE, data.error || `Job status ${data.status}`);
      } else if (
        data.status === 'SUCCEEDED' &&
        !pickRaster(data.rasters, scenario)
      ) {
        dropJob(
          JOB_FAILED_TITLE,
          'The model run produced no raster for this scenario'
        );
      } else {
        setJob(data);
      }
    };

    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, jobId, scenario, dropJob]);

  // Upload modal hooks (UploadModal's onUpload / onUploadSuccess / onFileChange).
  const upload = async ({ species, scenario: timeFrame, file }) => {
    const { fc, pointCount } = await readPresence(file);
    const newJobId = await submitJob({
      species,
      scenario: timeFrameKey(timeFrame),
      presence: fc,
    });
    return { pointCount, jobId: newJobId, fc };
  };

  const onUploadSuccess = ({ jobId: newJobId, fc, scenario: timeFrame }) => {
    setPresence({ jobId: newJobId, fc });
    setHashParams(
      { job: newJobId, scenario: timeFrameKey(timeFrame) },
      { push: true }
    );
  };

  const previewFile = (file) => {
    previewFileRef.current = file;
    if (!file) {
      setPreviewFc(null);
      return;
    }
    readPresence(file)
      .then(({ fc }) => previewFileRef.current === file && setPreviewFc(fc))
      .catch(() => previewFileRef.current === file && setPreviewFc(null));
  };

  const clear = () =>
    setHashParams({ job: null, scenario: null }, { push: true });

  const succeeded = active && job?.status === 'SUCCEEDED';
  const jobPresence = active && presence?.jobId === jobId ? presence.fc : null;

  return {
    // { jobId, scenario (display name), species, status } while a job is loaded.
    customData: active
      ? {
          jobId,
          scenario: timeFrameName(scenario),
          species: job?.species_name,
          status: job ? job.status : 'LOADING',
        }
      : null,
    rasterUrl: succeeded ? pickRaster(job.rasters, scenario) : null,
    // [{ virus (catalog name), color, foiUrl, hotspotUrl }] once it succeeded;
    // empty when the species has no FOI parameters.
    foiLayers: succeeded
      ? foiRasters(job.rasters, scenario).map(
          ({ virusSlug, foi, hotspots }) => {
            const { name, color } = findVirus(virusSlug);
            return { virus: name, color, foiUrl: foi, hotspotUrl: hotspots };
          }
        )
      : [],
    showFoi,
    setShowFoi,
    points: previewFc || (showPoints ? jobPresence : null),
    hasPoints: Boolean(jobPresence),
    showPoints,
    setShowPoints,
    upload,
    onUploadSuccess,
    previewFile,
    clear,
  };
};
