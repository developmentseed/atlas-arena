import csv from '@/config/foi_params.csv';

// Force-of-infection parameters per species/virus pair, from
// foi_params.csv (columns Species, Virus, Prevalence, Test, K_min, K_max; one
// row per study, prevalence in percent). Model runs send the averaged values
// for the chosen pathogens, so the API never reads the table itself.

const parseRows = (text) => {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const columns = header.split(',').map((c) => c.replace(/"/g, ''));
  return lines.map((line) => {
    const values = line.split(',').map((v) => v.replace(/"/g, '').trim());
    return Object.fromEntries(columns.map((c, i) => [c, values[i]]));
  });
};

// { [species key]: { [virus]: { prevalences: [percent], k_min, k_max } } }.
// K is per species, so the first row of a pair stands for all of them.
const index = {};
parseRows(csv).forEach(({ Species, Virus, Prevalence, K_min, K_max }) => {
  const key = Species.toLowerCase();
  const viruses = (index[key] = index[key] || {});
  viruses[Virus] = viruses[Virus] || {
    prevalences: [],
    k_min: Number(K_min),
    k_max: Number(K_max),
  };
  viruses[Virus].prevalences.push(Number(Prevalence));
});

const displayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);

// [{ key: 'abrothrix longipilis', name: 'Abrothrix longipilis' }], sorted.
export const FOI_SPECIES = Object.keys(index)
  .sort()
  .map((key) => ({ key, name: displayName(key) }));

export const speciesKey = (name) => (name || '').trim().toLowerCase();

export const virusesForSpecies = (species) =>
  Object.keys(index[speciesKey(species)] || {}).sort();

// The API's foi.pathogens for a species: mean prevalence (as a proportion)
// and K range for each of the given viruses it has parameters for.
export const foiPathogens = (species, viruses) => {
  const pairs = index[speciesKey(species)] || {};
  return viruses
    .filter((virus) => pairs[virus])
    .map((virus) => {
      const { prevalences, k_min, k_max } = pairs[virus];
      const mean = prevalences.reduce((a, b) => a + b, 0) / prevalences.length;
      return { virus, prevalence: mean / 100, k_min, k_max };
    });
};

// The species key for a presence layer name such as
// 'abrothrix_longipilis_(waterhouse_1837)_presence', or null.
export const matchSpecies = (layerName) => {
  if (!layerName) return null;
  const key = speciesKey(String(layerName).split('_').slice(0, 2).join(' '));
  return index[key] ? key : null;
};
