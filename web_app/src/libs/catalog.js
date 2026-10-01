import catalog from '@/config/catalog.json';

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
