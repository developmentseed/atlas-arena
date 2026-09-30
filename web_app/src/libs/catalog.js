import catalog from '@/config/catalog.json';

// Temporary: the explore map still reads Mapbox tilesets until the MapLibre + COG
// switch lands. Tileset ids were `<mapbox user>.<raster name>`.
const MAPBOX_TILESET_USER = 'epipandit';

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
      tileset_id: `${MAPBOX_TILESET_USER}.${layer.path.replace(/\.tif$/, '')}`,
      color: species[layer.species].color,
      color_virus: viruses[layer.virus].color,
    }));
};
