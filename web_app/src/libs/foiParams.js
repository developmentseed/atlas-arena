import { useEffect, useState } from 'react';
import { FOI_PARAMS_URL } from '@/config/constants/general';

// Force-of-infection parameters per species/virus pair, from the FOI params
// CSV on S3 (FOI_PARAMS_URL; columns Species, Virus, Prevalence, Test, K_min,
// K_max; one row per study, prevalence in percent). Fetched at runtime so it
// can be updated without a deploy. Model runs send the averaged values for the
// chosen pathogens, so the API never reads the table itself.

const parseRows = (text) => {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const columns = header.split(',').map((c) => c.replace(/"/g, ''));
  return lines.map((line) => {
    const values = line.split(',').map((v) => v.replace(/"/g, '').trim());
    return Object.fromEntries(columns.map((c, i) => [c, values[i]]));
  });
};

const displayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);

export const speciesKey = (name) => (name || '').trim().toLowerCase();

// The CSV text as lookups for the Run Models form.
export const parseFoiParams = (text) => {
  // { [species key]: { [virus]: { prevalences: [percent], k_min, k_max } } }.
  // K is per species, so the first row of a pair stands for all of them.
  const index = {};
  parseRows(text).forEach(({ Species, Virus, Prevalence, K_min, K_max }) => {
    const key = Species.toLowerCase();
    const viruses = (index[key] = index[key] || {});
    viruses[Virus] = viruses[Virus] || {
      prevalences: [],
      k_min: Number(K_min),
      k_max: Number(K_max),
    };
    viruses[Virus].prevalences.push(Number(Prevalence));
  });

  return {
    // [{ key: 'abrothrix longipilis', name: 'Abrothrix longipilis' }], sorted.
    species: Object.keys(index)
      .sort()
      .map((key) => ({ key, name: displayName(key) })),

    virusesFor: (species) =>
      Object.keys(index[speciesKey(species)] || {}).sort(),

    // The API's foi.pathogens for a species: mean prevalence (as a
    // proportion) and K range for each of the given viruses it has
    // parameters for.
    pathogens: (species, viruses) => {
      const pairs = index[speciesKey(species)] || {};
      return viruses
        .filter((virus) => pairs[virus])
        .map((virus) => {
          const { prevalences, k_min, k_max } = pairs[virus];
          const mean =
            prevalences.reduce((a, b) => a + b, 0) / prevalences.length;
          return { virus, prevalence: mean / 100, k_min, k_max };
        });
    },

    // The species key for a presence layer name such as
    // 'abrothrix_longipilis_(waterhouse_1837)_presence', or null.
    match: (layerName) => {
      if (!layerName) return null;
      const key = speciesKey(
        String(layerName).split('_').slice(0, 2).join(' ')
      );
      return index[key] ? key : null;
    },
  };
};

// One request per page load, shared by every caller. `no-cache` revalidates
// against S3's ETag, so an updated CSV shows up on the next load (a cheap 304
// otherwise) without adding a header that would need a CORS preflight.
let pending = null;

export const loadFoiParams = () => {
  if (!pending) {
    pending = fetch(FOI_PARAMS_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`FOI params: HTTP ${res.status}`);
        return res.text();
      })
      .then(parseFoiParams)
      .catch((error) => {
        pending = null; // let a later mount retry
        throw error;
      });
  }
  return pending;
};

// { foiParams, error }: foiParams is null until the CSV has loaded.
export const useFoiParams = () => {
  const [state, setState] = useState({ foiParams: null, error: null });
  useEffect(() => {
    let active = true;
    loadFoiParams().then(
      (foiParams) => active && setState({ foiParams, error: null }),
      (error) => {
        console.error(error);
        if (active) setState({ foiParams: null, error });
      }
    );
    return () => {
      active = false;
    };
  }, []);
  return state;
};
