import React, { useRef, useEffect, useState } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import Map from 'react-map-gl/maplibre';
import { useAppContext } from '@/store/context';
import { dynamicFilter, getUniqueCombinations, sortList } from '@/utils/utils';
import Sidebar from '@/components/explore/Sidebar';
import axios from 'axios';
import pako from 'pako';
import SDMLegend from '@/components/explore/SDMLegend';
import { getMetadataMd } from '@/libs/markdown';
import SidePanel from '@/components/explore/SidePanel';
import {
  ALL_VIRUS,
  BASEMAP_STYLE,
  DEFAULT_OPACITY_MULTIPLE,
  DEFAULT_OPACITY_SINGLE,
  MAX_ZOOM_MAP,
  MIN_ZOOM_MAP,
} from '@/config/constants/general';
import FoiVectorLayer from '@/components/explore/FoiVectorLayer';
import HotSpotLegend from '@/components/explore/HotSpotLegend';
import HeadMapLayer from '@/components/explore/HeadMapLayer';
import DeckOverlay from '@/components/explore/DeckOverlay';
import { buildCogLayer } from '@/components/explore/cogLayer';
import PresenceLayer from '@/components/explore/PresenceLayer';
import { useCustomJob } from '@/components/explore/useCustomJob';
import { FOI_RANGE } from '@/libs/catalog';
import {
  LEGEND_FOI_TITLE,
  LEGEND_FOI_TICKS,
} from '@/config/constants/constants.explore';
import MapSummary, {
  MAP_SUMMARY_TEXT_ID,
} from '@/components/explore/MapSummary';
import PageTitle from '@/components/custom/PageTitle';
import { buildPageTitle } from '@/config/constants/general';
import { MAP_REGION_LABEL } from '@/config/constants/constants.explore';
import { getHotspotSummary } from '@/libs/hotspots';

const BASENAME = (process.env.PUBLIC_URL || '').replace('//', '/');

const initialViewState = {
  latitude: -19,
  longitude: -55,
  zoom: 3.1,
};

const Explore = ({ mddata, hotspotSummary = {} }) => {
  const { raw_data } = useAppContext();

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const [viewState, setViewState] = useState({ ...initialViewState });
  const [filterTilesId, setFilterTilesId] = useState([]);
  const [foiHotspot, setFoiHotspot] = useState(null);
  const [opacityFilter, setLayerStyle] = useState({});

  const [dataVirus, setDataVirus] = useState({});
  const [hasDeltaValue, setHasDeltaValue] = useState(false);
  const [dataFilter, setDataFilter] = useState({});
  const [dataVirusSplit, setDataVirusSplit] = useState([]);

  const customJob = useCustomJob();
  const { customData } = customJob;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASENAME}/assets/data/hotspots.geojson.gz`,
          {
            responseType: 'arraybuffer',
          }
        );
        const decompressed = pako.inflate(response.data, { to: 'string' });
        const jsonDataMapp = JSON.parse(decompressed);

        const combinations = getUniqueCombinations(
          raw_data.filter((i) => i.virus && i.color_virus),
          'virus',
          'color_virus'
        ).map((i) => ({
          virus: i.virus,
          color: i.color_virus,
        }));
        if (jsonDataMapp && jsonDataMapp.features) {
          setFoiHotspot(jsonDataMapp);
          const newFeatures = await Promise.all(
            combinations.map(async (item) => ({
              ...item,
              data: {
                type: 'FeatureCollection',
                features: jsonDataMapp.features.filter(
                  (i) => i.properties.virus === item.virus
                ),
              },
            }))
          );
          setDataVirusSplit(newFeatures);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [raw_data]);

  const handleFilterTilesId = (data_filter) => {
    const raw_data_filter = dynamicFilter([...raw_data], { ...data_filter });
    const hasDelta =
      data_filter &&
      data_filter.time_frame &&
      data_filter.time_frame.length &&
      data_filter.time_frame.filter((i) =>
        `${i}`.toLowerCase().includes('delta')
      ).length > 0;
    setHasDeltaValue(hasDelta);
    setFilterTilesId(raw_data_filter);
    setDataFilter(data_filter);

    // show virus draw
    const { virus } = data_filter;

    if (virus && mddata) {
      setDataVirus(mddata[virus] || {});
    } else {
      setDataVirus({});
    }
  };

  const handleChangeLayerStyle = (specie, val) => {
    let tmpOpacityFilter = { ...opacityFilter };
    tmpOpacityFilter[specie] = val;
    setLayerStyle({ ...tmpOpacityFilter });
  };

  // While custom data is loaded it replaces the catalog SDM layers; the SDM
  // toggle (off clears the model filter) still hides it.
  const customItems =
    customData && customJob.rasterUrl && dataFilter.model
      ? [
          {
            species: customData.species,
            url: customJob.rasterUrl,
            range: [0, 1],
            color: (
              raw_data.find((i) => i.species === customData.species) || {}
            ).color,
          },
        ]
      : [];
  const sdmItems = customData ? customItems : filterTilesId;

  // Same default as the legend's opacity slider (SDMLegend's has_many).
  const speciesCount = new Set(sdmItems.map((i) => i.species)).size;
  const defaultOpacity =
    speciesCount > 1 ? DEFAULT_OPACITY_MULTIPLE : DEFAULT_OPACITY_SINGLE;
  const sdmLayers = sdmItems.map((item) =>
    buildCogLayer({
      item,
      opacity: (opacityFilter[item.species] ?? defaultOpacity) / 100,
    })
  );

  // A custom job's FOI outputs, per virus, following the Virus dropdown. They
  // replace the catalog hotspots while it's loaded. Opacity keys: the virus
  // name for hotspots (as the catalog hotspot legend), `<virus> FOI` for FOI.
  const foiLayers = customJob.foiLayers.filter(
    (i) => dataFilter.virus === ALL_VIRUS || dataFilter.virus === i.virus
  );
  const shownFoi = customJob.showFoi ? foiLayers : [];
  const foiOpacityKey = (virus) => `${virus} FOI`;
  const foiDefaultOpacity =
    shownFoi.length > 1 ? DEFAULT_OPACITY_MULTIPLE : DEFAULT_OPACITY_SINGLE;
  const cogLayers = [
    ...sdmLayers,
    ...shownFoi
      .filter((i) => i.foiUrl)
      .map((i) =>
        buildCogLayer({
          item: { url: i.foiUrl, range: FOI_RANGE, color: i.color },
          opacity:
            (opacityFilter[foiOpacityKey(i.virus)] ?? foiDefaultOpacity) / 100,
        })
      ),
    ...foiLayers
      .filter((i) => i.hotspotUrl)
      .map((i) =>
        buildCogLayer({
          item: {
            url: i.hotspotUrl,
            range: [0, 1],
            color: i.color,
            mask: true,
          },
          opacity: (opacityFilter[i.virus] ?? DEFAULT_OPACITY_MULTIPLE) / 100,
        })
      ),
  ];
  const labelsFoi = shownFoi.map((i) => ({
    title: foiOpacityKey(i.virus),
    name: i.virus,
    color: i.color,
  }));

  // "Show only this layer": hide every other legend layer
  const handleShowOnlyLayer = (title) => {
    const allLayers = [...labelSDM, ...labelsFoi, ...labelsHotSpot].map(
      (i) => i.title
    );
    setLayerStyle(
      Object.fromEntries(allLayers.map((i) => [i, i === title ? 100 : 0]))
    );
  };

  const handleShowAllLayers = () => {
    setLayerStyle({});
  };

  const labelSDM = sortList(
    getUniqueCombinations(
      sdmItems.filter((i) => i.species),
      'species',
      'color'
    ).map((i) => ({
      title: i.species,
      color: i.color,
    })),
    'title'
  );

  const catalogLabelsHotSpot = sortList(
    getUniqueCombinations(
      raw_data
        .filter((i) => i.virus && dataFilter.hotspot)
        .filter((j) => {
          if (dataFilter.virus === ALL_VIRUS) return true;
          return dataFilter.virus === j.virus;
        }),
      'virus',
      'color_virus'
    ).map((i) => ({
      title: i.virus,
      color: i.color_virus,
    })),
    'title'
  );
  const labelsHotSpot = customData
    ? foiLayers
        .filter((i) => i.hotspotUrl)
        .map((i) => ({ title: i.virus, color: i.color }))
    : catalogLabelsHotSpot;
  return (
    <Flex
      position='relative'
      h='100%'
      flexDirection={{ base: 'column', md: 'row' }}
    >
      <PageTitle title={buildPageTitle('Explore')} />
      <Sidebar
        handleFilterTilesId={handleFilterTilesId}
        filterTilesId={filterTilesId}
        customData={customData}
        onUpload={customJob.upload}
        onUploadSuccess={customJob.onUploadSuccess}
        onFileChange={customJob.previewFile}
        onClearCustomData={customJob.clear}
        hasPoints={customJob.hasPoints}
        showPoints={customJob.showPoints}
        onTogglePoints={() => customJob.setShowPoints((show) => !show)}
        hasFoi={customJob.foiLayers.length > 0}
        showFoi={customJob.showFoi}
        onToggleFoi={() => customJob.setShowFoi((show) => !show)}
      >
        <MapSummary
          summary={hotspotSummary}
          timeFrame={dataFilter.time_frame}
          model={dataFilter.model}
          hotspotLayers={labelsHotSpot}
          sdmLayers={labelSDM}
          opacity={opacityFilter}
        />
      </Sidebar>
      <Box flex={1} minH={0} minW={0} position='relative'>
        <Box
          id='explore-map'
          role='region'
          aria-label={MAP_REGION_LABEL}
          aria-describedby={MAP_SUMMARY_TEXT_ID}
          tabIndex={-1}
          _focus={{ outline: 'none' }}
          h='100%'
        >
          <Box ref={mapContainerRef} h='100%' w='100%'>
            <Map
              ref={mapRef}
              initialViewState={viewState}
              // onLoad={handleLoad}
              minZoom={MIN_ZOOM_MAP}
              maxZoom={MAX_ZOOM_MAP}
              dragRotate={false}
              mapStyle={BASEMAP_STYLE}
            >
              <FoiVectorLayer
                jsonData={foiHotspot}
                raw_data={raw_data}
                hotspot={!customData && dataFilter.hotspot}
                time_frame={dataFilter.time_frame}
                virus={dataFilter.virus}
                opacity_filter={opacityFilter}
              />
              <HeadMapLayer
                dataVirusSplit={dataVirusSplit}
                hotspot={!customData && dataFilter.hotspot}
                time_frame={dataFilter.time_frame}
                virus={dataFilter.virus}
                opacity_filter={opacityFilter}
              />
              <DeckOverlay layers={cogLayers} />
              <PresenceLayer data={customJob.points} />
            </Map>
          </Box>
        </Box>
        <Box
          position='absolute'
          maxH='calc(100% - 32px)'
          bottom={4}
          left={4}
          display='flex'
          flexDirection='column'
          alignItems='flex-end'
          gap={2}
          zIndex={10}
          width={{ base: '90%', md: 'auto' }}
        >
          <SDMLegend
            labels={labelSDM}
            value={opacityFilter}
            isDelta={!customData && hasDeltaValue}
            handleChange={handleChangeLayerStyle}
            handleShowOnly={handleShowOnlyLayer}
            handleShowAll={handleShowAllLayers}
          />
          <SDMLegend
            labels={labelsFoi}
            value={opacityFilter}
            heading={LEGEND_FOI_TITLE}
            ticks={LEGEND_FOI_TICKS}
            handleChange={handleChangeLayerStyle}
            handleShowOnly={handleShowOnlyLayer}
            handleShowAll={handleShowAllLayers}
          />
          <HotSpotLegend
            labels={labelsHotSpot}
            value={opacityFilter}
            handleChange={handleChangeLayerStyle}
            handleShowOnly={handleShowOnlyLayer}
            handleShowAll={handleShowAllLayers}
          />
        </Box>
        <SidePanel dataVirus={dataVirus} />
      </Box>
    </Flex>
  );
};

export async function getStaticProps() {
  const dataPromises = getMetadataMd(['public', 'markdown'], true);
  const data = await Promise.all(dataPromises);
  const result = data
    .filter((item) => item.layout === 'virus')
    .reduce((acc, item) => {
      acc[item.name] = { ...item };
      return acc;
    }, {});
  // home data
  return {
    props: {
      mddata: result,
      hotspotSummary: getHotspotSummary(),
    },
  };
}

export default Explore;
