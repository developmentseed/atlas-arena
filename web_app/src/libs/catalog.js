import catalog from '@/config/catalog.json';
import { FALLBACK_COLOR_ORDER } from '@/config/constants/general';

// Flatten the catalog into the row shape the store and filters already use
// (display names for virus/species/time_frame/model, plus colours).
export const getCatalogRows = () => {
  const { cog_base_url, viruses, species, time_frames, models, variables } =
    catalog;

  return catalog.layers
    .filter((layer) => layer.enabled !== false)
    .map((layer) => ({
      virus: viruses[layer.virus].name,
      species: species[layer.species].name,
      time_frame: time_frames[layer.time_frame].name,
      model: models[layer.model].name,
      variable: layer.variable,
      range: variables[layer.variable].range,
      url: `${cog_base_url}${layer.path}`,
      color: species[layer.species].color,
      color_virus: viruses[layer.virus].color,
    }));
};

// time_frames keys ('current', 'ssp2', ...) are the stable ids used in URLs;
// the rest of the app works with their display names.
export const timeFrameName = (key) => catalog.time_frames[key]?.name;
export const timeFrameKey = (name) =>
  Object.keys(catalog.time_frames).find(
    (key) => catalog.time_frames[key].name === name
  );

// A virus named in model outputs (a slug like 'junin' or 'junin_virus') as its
// catalog name and colour, falling back to a readable name and default colour.
export const findVirus = (slug) => {
  const key = [slug, `${slug}_virus`].find((k) => catalog.viruses[k]);
  if (key) return catalog.viruses[key];
  const name = slug.replace(/_/g, ' ');
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    color: 'default',
  };
};

// A species display name's catalog colour; undefined outside the catalog.
export const findSpeciesColor = (name) =>
  Object.values(catalog.species).find(
    (species) => species.name.toLowerCase() === `${name}`.toLowerCase()
  )?.color;

// One MAP_COLORS ramp per requested colour name, no two alike, for layers
// shown together. The first request for a catalog colour keeps it; repeats and
// missing ('default', null) ones get the next unused FALLBACK_COLOR_ORDER
// ramp, cycling once all are used.
export const distinctColors = (requested) => {
  const used = new Set();
  const kept = requested.map((color) => {
    if (!color || color === 'default' || used.has(color)) return null;
    used.add(color);
    return color;
  });
  return kept.map((color, i) => {
    if (color) return color;
    const next =
      FALLBACK_COLOR_ORDER.find((c) => !used.has(c)) ||
      FALLBACK_COLOR_ORDER[i % FALLBACK_COLOR_ORDER.length];
    used.add(next);
    return next;
  });
};

export const FOI_RANGE = catalog.variables.foi.range;
