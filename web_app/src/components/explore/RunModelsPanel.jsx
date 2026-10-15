import { useEffect, useId, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Circle,
  CloseButton,
  Field,
  FileUpload,
  Flex,
  Heading,
  HStack,
  VStack,
  Icon,
  List,
  NativeSelect,
  Progress,
  Spinner,
  Stack,
  Text,
  useFileUpload,
} from '@chakra-ui/react';
import { LuCheck, LuInfo, LuLink, LuUpload } from 'react-icons/lu';
import { useAppContext } from '@/store/context';
import { speciesKey, useFoiParams } from '@/libs/foiParams';
import FormControlRadioTime from '@/components/custom/FormControlRadioTime';
import FormControlSwitch from '@/components/custom/FormControlSwitch';
import {
  TIMEFRAME_LABEL,
  TIMEFRAME_INFO,
  RUN_STEP_UPLOAD,
  RUN_SINGLE_SPECIES,
  RUN_STEP_SPECIES,
  RUN_STEP_PATHOGEN,
  RUN_PATHOGEN_BADGE,
  RUN_SPECIES_LOADING,
  RUN_SPECIES_ERROR_TITLE,
  RUN_SPECIES_ERROR_TEXT,
  RUN_STEP_MODEL,
  RUN_SUBMIT,
  RUN_IN_PROGRESS,
  RUN_SERVER_NOTICE,
  UPLOAD_ACCEPT,
  UPLOAD_DROPZONE_TEXT,
  UPLOAD_DROPZONE_BROWSE,
  UPLOAD_DROPZONE_HINT,
  UPLOAD_DROPZONE_LABEL,
  UPLOAD_FILE_DETAILS,
  UPLOAD_REMOVE_FILE,
  UPLOAD_IN_PROGRESS,
  UPLOAD_ERROR_TITLE,
  UPLOAD_ERROR_TEXT,
  RESULTS_SPECIES_LABEL,
  RESULTS_POINTS,
  MAP_LAYERS_LABEL,
  UPLOAD_NEW_DATASET,
  JOB_STATUS_TEXT,
  SHOW_FOI_LABEL,
  SHOW_POINTS_LABEL,
} from '@/config/constants/constants.explore';

const STATUS = { IDLE: 'idle', UPLOADING: 'uploading', ERROR: 'error' };

const stepLabelProps = {
  fontSize: 'sm',
  fontWeight: 500,
  color: 'gray.700',
  m: 0,
};

// A numbered step: an ordered-list item with a circled step number. `wrap`
// puts the label and control inside their Field (or FileUpload) root.
const Step = ({ number, label, badge = null, wrap, children }) => (
  <List.Item display='block'>
    {wrap(
      <>
        <HStack gap={1} w='full'>
          <Circle
            size={5}
            bg='white'
            color='blue.700'
            boxShadow='0 0 0 0.5px currentColor'
            textAlign='center'
            lineHeight={1}
            fontSize='xs'
            fontWeight={600}
            aria-hidden='true'
          >
            {number}
          </Circle>
          {label}
          {badge && (
            <Badge
              ms='auto'
              variant='subtle'
              size='xs'
              colorPalette='gray'
              textTransform='uppercase'
            >
              {badge}
            </Badge>
          )}
        </HStack>
        {children}
      </>
    )}
  </List.Item>
);

const fieldStep =
  (props = {}) =>
  (body) => (
    <Field.Root gap={2} {...props}>
      {body}
    </Field.Root>
  );

// The "Run Models" tab: upload presence data and submit a model run, follow
// its progress, then show the result's controls. Uses the custom job hooks
// from useCustomJob (via Sidebar); this component only adds form state.
const RunModelsPanel = ({
  customData = null,
  onUpload = null,
  onUploadSuccess = null,
  onFileChange = null,
  onClearCustomData = null,
  previewCount = null,
  previewName = null,
  linkedViruses = [],
  onScenarioChange,
  hasFoi = false,
  showFoi = true,
  onToggleFoi,
  hasPoints = false,
  showPoints = true,
  onTogglePoints,
}) => {
  const { allModels, allTimeFrame } = useAppContext();
  const pathogenHeadingId = useId();
  const { foiParams, error: foiParamsError } = useFoiParams();
  const allSpecies = foiParams ? foiParams.species : [];

  const [species, setSpecies] = useState('');
  // The checked pathogens, or null for all of the species' viruses.
  const [checkedPathogens, setCheckedPathogens] = useState(null);
  const [model, setModel] = useState('');
  const [status, setStatus] = useState(STATUS.IDLE);
  const [pointCount, setPointCount] = useState(null);
  const dropzoneRef = useRef(null);
  const focusDropzoneOnReset = useRef(false);

  const isUploading = status === STATUS.UPLOADING;
  const isSucceeded = customData && customData.status === 'SUCCEEDED';
  const isRunning = isUploading || (customData && !isSucceeded);
  // The species list (FOI params CSV) is fetched; the form waits for it.
  const isFormDisabled = isRunning || !foiParams;

  const fileUpload = useFileUpload({
    maxFiles: 1,
    accept: UPLOAD_ACCEPT,
    disabled: isRunning,
    translations: { dropzone: UPLOAD_DROPZONE_LABEL },
    onFileChange: ({ acceptedFiles }) => {
      const next = acceptedFiles[0] || null;
      setStatus(STATUS.IDLE);
      if (onFileChange) onFileChange(next);
    },
  });
  const file = fileUpload.acceptedFiles[0] || null;

  const selectedSpecies =
    species ||
    speciesKey(customData && customData.species) ||
    (allSpecies[0] && allSpecies[0].key) ||
    '';
  const selectedModel = model || (allModels[0] && allModels[0].key) || '';
  const speciesViruses = foiParams ? foiParams.virusesFor(selectedSpecies) : [];
  const speciesName = (key) =>
    (allSpecies.find((item) => item.key === key) || {}).name || key;
  const pathogens = checkedPathogens ?? speciesViruses;

  // A new species starts with all of its pathogens checked.
  const selectSpecies = (key) => {
    setSpecies(key);
    setCheckedPathogens(null);
  };

  const togglePathogen = (virus) =>
    setCheckedPathogens(
      pathogens.includes(virus)
        ? pathogens.filter((v) => v !== virus)
        : speciesViruses.filter((v) => v === virus || pathogens.includes(v))
    );

  // Pre-select the species a picked file's layer name refers to (also once
  // the species list arrives, if the file was picked first).
  useEffect(() => {
    const key = foiParams && foiParams.match(previewName);
    if (!key) return;
    setSpecies(key);
    setCheckedPathogens(null);
  }, [foiParams, previewName]);

  // After "Upload new dataset", the results are replaced by the form: move
  // focus to its first step so it isn't lost with the removed button.
  useEffect(() => {
    if (!customData && focusDropzoneOnReset.current) {
      focusDropzoneOnReset.current = false;
      if (dropzoneRef.current) dropzoneRef.current.focus();
    }
  }, [customData]);

  const handleRun = async () => {
    if (!onUpload || !file || !foiParams) return;
    setStatus(STATUS.UPLOADING);
    try {
      const result = await onUpload({
        species: speciesName(selectedSpecies),
        pathogens: foiParams.pathogens(selectedSpecies, pathogens),
        file,
      });
      const count = (result && result.pointCount) || 0;
      setPointCount(count);
      if (onUploadSuccess) {
        onUploadSuccess({
          ...result,
          species: speciesName(selectedSpecies),
          file,
          pointCount: count,
        });
      }
      // The job's own presence points replace the file preview.
      if (onFileChange) onFileChange(null);
      setStatus(STATUS.IDLE);
    } catch (error) {
      console.error(error);
      setStatus(STATUS.ERROR);
    }
  };

  const handleNewDataset = () => {
    fileUpload.clearFiles();
    selectSpecies('');
    setPointCount(null);
    setStatus(STATUS.IDLE);
    focusDropzoneOnReset.current = true;
    if (onClearCustomData) onClearCustomData();
  };

  if (isSucceeded) {
    const count = previewCount ?? pointCount;
    return (
      <Flex direction='column' flex={1} gap={4}>
        <Flex
          direction='column'
          borderWidth='1px'
          borderColor='gray.200'
          borderRadius='md'
          bg='white'
          p={3}
          gap={0.5}
        >
          <Text
            as='h2'
            fontSize='xs'
            fontWeight={600}
            letterSpacing='0.5px'
            color='gray.600'
            lineHeight='short'
            textTransform='uppercase'
          >
            {RESULTS_SPECIES_LABEL}
          </Text>
          <Text fontSize='md' fontWeight={500} fontStyle='italic' color='blue.700'>
            {customData.species}
          </Text>
          {count != null && (
            <Text fontSize='xs' color='gray.600'>
              {RESULTS_POINTS(count)}
            </Text>
          )}
          {linkedViruses.map((virus) => (
            <HStack key={virus} gap={1} fontSize='sm' fontWeight={600}>
              <Icon as={LuLink} boxSize={3} aria-hidden='true' />
              <Text>{virus}</Text>
            </HStack>
          ))}
        </Flex>
        <FormControlRadioTime
          label={TIMEFRAME_LABEL}
          info={TIMEFRAME_INFO}
          options={allTimeFrame}
          // Every run models all scenarios; this flips between its rasters.
          handleAction={([name]) => onScenarioChange(name)}
          value={customData.scenario}
          availableValues={customData.availableScenarios}
        />
        {(hasFoi || hasPoints) && (
          <Box role='group' aria-labelledby='map-layers-heading'>
            <Heading
              as='h2'
              id='map-layers-heading'
              fontSize='xs'
              fontWeight={600}
              letterSpacing='0.5px'
              color='gray.600'
              lineHeight='short'
              textTransform='uppercase'
            >
              {MAP_LAYERS_LABEL}
            </Heading>
            {hasFoi && (
              <FormControlSwitch
                label={SHOW_FOI_LABEL}
                value={showFoi}
                handleAction={onToggleFoi}
              />
            )}
            {hasPoints && (
              <FormControlSwitch
                label={SHOW_POINTS_LABEL}
                value={showPoints}
                handleAction={onTogglePoints}
              />
            )}
          </Box>
        )}
        <Button
          mt='auto'
          size='lg'
          variant='outline'
          colorPalette='blue'
          borderColor='currentColor'
          bg='white'
          onClick={handleNewDataset}
        >
          {UPLOAD_NEW_DATASET}
        </Button>
      </Flex>
    );
  }

  const statusText = isUploading
    ? UPLOAD_IN_PROGRESS
    : customData && JOB_STATUS_TEXT[customData.status];

  return (
    <Flex direction='column' flex={1} gap={4}>
      <List.Root as='ol' variant='plain' gap={5}>
        <Step
          number={1}
          label={
            <FileUpload.Label {...stepLabelProps}>
              {RUN_STEP_UPLOAD}
            </FileUpload.Label>
          }
          wrap={(body) => (
            <FileUpload.RootProvider
              value={fileUpload}
              alignItems='stretch'
              gap={2}
            >
              {body}
            </FileUpload.RootProvider>
          )}
        >
          <HStack gap={1} color='blue.600' fontSize='sm' fontWeight={500}>
            <Icon as={LuInfo} boxSize={4} aria-hidden='true' />
            <Text fontSize='xs'>{RUN_SINGLE_SPECIES}</Text>
          </HStack>
          <FileUpload.HiddenInput />
          {!file && (
            <FileUpload.Dropzone
              ref={dropzoneRef}
              minH='auto'
              py={5}
              px={4}
              gap={1}
              borderWidth='2px'
              borderStyle='dashed'
              borderColor='blue.400'
              bg='blue.50'
              borderRadius='md'
              cursor='pointer'
              _dragging={{ bg: 'blue.100', borderColor: 'blue.600' }}
            >
              <Icon
                as={LuUpload}
                boxSize={6}
                color='blue.700'
                aria-hidden='true'
              />
              <FileUpload.DropzoneContent textAlign='center' gap={1}>
                <Text fontSize='sm' fontWeight={600} color='gray.800'>
                  {UPLOAD_DROPZONE_TEXT}
                </Text>
                <Text
                  fontSize='sm'
                  fontWeight={600}
                  color='blue.700'
                  textDecoration='underline'
                >
                  {UPLOAD_DROPZONE_BROWSE}
                </Text>
                <Text fontSize='xs' color='gray.600'>
                  {UPLOAD_DROPZONE_HINT}
                </Text>
              </FileUpload.DropzoneContent>
            </FileUpload.Dropzone>
          )}
          <FileUpload.ItemGroup>
            {fileUpload.acceptedFiles.map((item) => (
              <FileUpload.Item
                key={item.name}
                file={item}
                bg='white'
                borderColor='gray.300'
                borderRadius='md'
                p={2}
                gap={3}
              >
                <Circle size={7} bg='green.100' color='green.700'>
                  <Icon as={LuCheck} boxSize={4} aria-hidden='true' />
                </Circle>
                <FileUpload.ItemContent lineHeight={1}>
                  <FileUpload.ItemName fontWeight={600} mb={1} />
                  <VStack gap={1} fontSize='xs' color='gray.600' align='start'>
                    <Text>
                      {UPLOAD_FILE_DETAILS(previewCount ?? pointCount)}
                    </Text>
                    <FileUpload.ItemSizeText />
                  </VStack>
                </FileUpload.ItemContent>
                {!isRunning && (
                  <FileUpload.ItemDeleteTrigger asChild>
                    <CloseButton
                      size='2xs'
                      colorPalette='gray'
                      aria-label={`${UPLOAD_REMOVE_FILE} ${item.name}`}
                      label={UPLOAD_REMOVE_FILE}
                    />
                  </FileUpload.ItemDeleteTrigger>
                )}
              </FileUpload.Item>
            ))}
          </FileUpload.ItemGroup>
        </Step>

        <Step
          number={2}
          label={
            <Field.Label {...stepLabelProps}>{RUN_STEP_SPECIES}</Field.Label>
          }
          wrap={fieldStep()}
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              disabled={isFormDisabled}
              bg='white'
              borderColor='gray.300'
              value={selectedSpecies}
              onChange={(event) => selectSpecies(event.target.value)}
            >
              {!foiParams && <option value=''>{RUN_SPECIES_LOADING}</option>}
              {allSpecies.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Step>

        <Step
          number={3}
          label={
            <Text id={pathogenHeadingId} {...stepLabelProps}>
              {RUN_STEP_PATHOGEN}
            </Text>
          }
          badge={RUN_PATHOGEN_BADGE}
          // A plain group, not a Field: checkboxes inside a Field take its
          // ids, so they would all share one input id and label.
          wrap={(body) => (
            <Stack gap={2} role='group' aria-labelledby={pathogenHeadingId}>
              {body}
            </Stack>
          )}
        >
          <Stack gap={1}>
            {speciesViruses.map((virus) => (
              <Checkbox.Root
                key={virus}
                size='sm'
                colorPalette='blue'
                checked={pathogens.includes(virus)}
                onCheckedChange={() => togglePathogen(virus)}
                disabled={isRunning}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontWeight='normal' fontStyle='italic'>
                  {virus}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
            {!speciesViruses.length && <Text fontSize='sm'>—</Text>}
          </Stack>
        </Step>

        <Step
          number={4}
          label={
            <Field.Label {...stepLabelProps}>{RUN_STEP_MODEL}</Field.Label>
          }
          wrap={fieldStep()}
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              disabled={isRunning}
              bg='white'
              borderColor='gray.300'
              value={selectedModel}
              onChange={(event) => setModel(event.target.value)}
            >
              {allModels.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Step>
      </List.Root>

      <Stack gap={3} mt='auto' pt={4}>
        {foiParamsError && (
          <Alert.Root status='error' role='alert'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{RUN_SPECIES_ERROR_TITLE}</Alert.Title>
              <Alert.Description>{RUN_SPECIES_ERROR_TEXT}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        {status === STATUS.ERROR && (
          <Alert.Root status='error' role='alert'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{UPLOAD_ERROR_TITLE}</Alert.Title>
              <Alert.Description>{UPLOAD_ERROR_TEXT}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        <Button
          size='lg'
          colorPalette={file && !isFormDisabled ? 'blue' : 'gray'}
          variant={file && !isFormDisabled ? 'solid' : 'subtle'}
          disabled={!file || isFormDisabled}
          onClick={handleRun}
        >
          {isRunning ? RUN_IN_PROGRESS : RUN_SUBMIT}
        </Button>
        {isRunning && (
          <Box>
            <Progress.Root
              value={null}
              size='xs'
              colorPalette='blue'
              aria-label={RUN_IN_PROGRESS}
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <HStack gap={2} mt={2} role='status'>
              <Spinner size='xs' color='blue.600' aria-hidden='true' />
              <Text fontSize='xs'>
                {statusText}
              </Text>
            </HStack>
          </Box>
        )}
        {isRunning && customData && (
          <Button
            variant='ghost'
            size='sm'
            colorPalette='blue'
            onClick={handleNewDataset}
          >
            {UPLOAD_NEW_DATASET}
          </Button>
        )}
        <Alert.Root status='info' variant='subtle' colorPalette='blue'>
          <Alert.Indicator />
          <Alert.Description fontSize='sm'>
            {RUN_SERVER_NOTICE}
          </Alert.Description>
        </Alert.Root>
      </Stack>
    </Flex>
  );
};

export default RunModelsPanel;
