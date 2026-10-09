import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Fieldset,
  Flex,
  Icon,
  Input,
  NativeSelect,
  Portal,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LuCheck, LuPlusCircle, LuX } from 'react-icons/lu';
import { useAppContext } from '@/store/context';
import { DEFAULT_TIME } from '@/config/constants/general';
import {
  UPLOAD_TITLE,
  UPLOAD_DESCRIPTION,
  UPLOAD_SCENARIO_LABEL,
  UPLOAD_SPECIES_LABEL,
  UPLOAD_DROPZONE_TEXT,
  UPLOAD_DROPZONE_HINT,
  UPLOAD_ACCEPT,
  UPLOAD_CANCEL,
  UPLOAD_SUBMIT,
  UPLOAD_IN_PROGRESS,
  UPLOAD_SUCCESS_TITLE,
  UPLOAD_SUCCESS_TEXT,
  UPLOAD_DONE,
  UPLOAD_ERROR_TITLE,
  UPLOAD_ERROR_TEXT,
  UPLOAD_RETRY,
} from '@/config/constants/constants.explore';

// form -> uploading -> success | error
const STATUS = {
  FORM: 'form',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const StatusMessage = ({ icon: IconSvg, iconBg, title, text, role }) => (
  <Box role={role}>
    <Flex alignItems='center' gap={2} mb={2}>
      <Flex
        alignItems='center'
        justifyContent='center'
        boxSize={6}
        borderRadius='full'
        bg={iconBg}
        flexShrink={0}
        aria-hidden='true'
      >
        <Icon as={IconSvg} boxSize={4} color='white' strokeWidth={3} />
      </Flex>
      <Text fontSize='md' fontWeight={600} color='black'>
        {title}
      </Text>
    </Flex>
    <Text fontSize='xs' color='gray.700'>
      {text}
    </Text>
  </Box>
);

// onUpload({ scenario, species, file }) should return a promise that resolves
// to { pointCount, ... } on success and rejects on failure; onUploadSuccess is
// then called with the upload details, merged over what onUpload resolved to.
// onFileChange(file | null) reports the chosen file as it changes.
// `initialStatus` lets a state be previewed before the upload is wired up.
const UploadModal = ({
  isOpen,
  onClose,
  onUpload = null,
  onUploadSuccess = null,
  onFileChange = null,
  accept = UPLOAD_ACCEPT,
  initialStatus = STATUS.FORM,
}) => {
  const { allTimeFrame, allSpecies } = useAppContext();

  const scenarios = allTimeFrame.filter(
    (i) => !`${i.name}`.toLowerCase().includes('delta')
  );

  const [scenario, setScenario] = useState(DEFAULT_TIME);
  const [species, setSpecies] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [pointCount, setPointCount] = useState(0);
  const resultActionRef = useRef(null);

  // Move focus to the result's primary action; the Upload button that had
  // focus is removed when the status changes.
  useEffect(() => {
    if (resultActionRef.current) resultActionRef.current.focus();
  }, [status]);

  const selectedSpecies = species || (allSpecies[0] && allSpecies[0].key) || '';

  const chooseFile = (next) => {
    setFile(next);
    if (onFileChange) onFileChange(next);
  };

  const handleClose = () => {
    setScenario(DEFAULT_TIME);
    setSpecies('');
    chooseFile(null);
    setIsDragging(false);
    setStatus(initialStatus);
    setPointCount(0);
    onClose();
  };

  const handleRetry = () => {
    chooseFile(null);
    setStatus(STATUS.FORM);
  };

  const handleFileChange = (event) => {
    chooseFile(event.target.files[0] || null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) chooseFile(dropped);
  };

  const handleUpload = async () => {
    if (!onUpload) return;
    setStatus(STATUS.UPLOADING);
    try {
      const result = await onUpload({
        scenario,
        species: selectedSpecies,
        file,
      });
      const count = (result && result.pointCount) || 0;
      setPointCount(count);
      setStatus(STATUS.SUCCESS);
      if (onUploadSuccess) {
        onUploadSuccess({
          ...result,
          scenario,
          species: selectedSpecies,
          file,
          pointCount: count,
        });
      }
    } catch (error) {
      console.error(error);
      setStatus(STATUS.ERROR);
    }
  };

  const renderForm = (
    <>
      <Text fontSize='sm' color='gray.700' mb={4}>
        {UPLOAD_DESCRIPTION}
      </Text>

      <Field.Root mb={4} disabled={status === STATUS.UPLOADING}>
        <Field.Label fontSize='sm' fontWeight={700} mb={2}>
          {UPLOAD_SPECIES_LABEL}
        </Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            value={selectedSpecies}
            onChange={(event) => setSpecies(event.target.value)}
            bg='white'
            borderColor='gray.200'
          >
            {allSpecies.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      {/* The whole drop zone is the file input's label: click or
          Enter/Space on the focused input opens the file picker. */}
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        gap={2}
        minH='110px'
        px={4}
        py={6}
        textAlign='center'
        cursor='pointer'
        border='1px dashed'
        borderColor={isDragging ? 'blue.500' : 'gray.300'}
        borderRadius='md'
        mb={4}
        bg={isDragging ? 'blue.50' : 'gray.100'}
        transition='background-color 0.2s, border-color 0.2s'
        _hover={{ borderColor: 'gray.400' }}
        _focusWithin={{ boxShadow: 'outline' }}
        asChild
      >
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon
            as={LuPlusCircle}
            boxSize={6}
            color='gray.500'
            strokeWidth={1.5}
            aria-hidden='true'
          />
          <Text fontSize='sm' color='gray.800'>
            {file ? file.name : UPLOAD_DROPZONE_TEXT}
          </Text>
          <Text fontSize='xs' color='gray.600'>
            {UPLOAD_DROPZONE_HINT}
          </Text>
          <Input
            type='file'
            accept={accept}
            onChange={handleFileChange}
            disabled={status === STATUS.UPLOADING}
            srOnly
          />
        </label>
      </Box>
      <Fieldset.Root mb={4} disabled={status === STATUS.UPLOADING}>
        <Fieldset.Legend fontSize='sm' fontWeight={700} mb={2}>
          {UPLOAD_SCENARIO_LABEL}
        </Fieldset.Legend>
        <RadioGroup.Root
          value={scenario}
          onValueChange={(e) => setScenario(e.value)}
          size='sm'
          colorPalette='blue'
        >
          <Stack gap={1}>
            {scenarios.map((item) => (
              <RadioGroup.Item key={item.key} value={item.key}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText fontSize='sm'>
                  {item.name}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </Stack>
        </RadioGroup.Root>
      </Fieldset.Root>
    </>
  );

  const content = {
    [STATUS.SUCCESS]: {
      body: (
        <StatusMessage
          role='status'
          icon={LuCheck}
          iconBg='green.600'
          title={UPLOAD_SUCCESS_TITLE}
          text={UPLOAD_SUCCESS_TEXT(pointCount)}
        />
      ),
      footer: (
        <Button colorPalette='blue' onClick={handleClose} ref={resultActionRef}>
          {UPLOAD_DONE}
        </Button>
      ),
    },
    [STATUS.ERROR]: {
      body: (
        <StatusMessage
          role='alert'
          icon={LuX}
          iconBg='red.600'
          title={UPLOAD_ERROR_TITLE}
          text={UPLOAD_ERROR_TEXT}
        />
      ),
      footer: (
        <>
          <Button variant='subtle' onClick={handleClose}>
            {UPLOAD_CANCEL}
          </Button>
          <Button
            colorPalette='blue'
            onClick={handleRetry}
            ref={resultActionRef}
          >
            {UPLOAD_RETRY}
          </Button>
        </>
      ),
    },
  };

  const formFooter = (
    <>
      <Button
        variant='subtle'
        onClick={handleClose}
        disabled={status === STATUS.UPLOADING}
      >
        {UPLOAD_CANCEL}
      </Button>
      <Button
        colorPalette='blue'
        onClick={handleUpload}
        disabled={!file}
        loading={status === STATUS.UPLOADING}
      >
        {UPLOAD_SUBMIT}
      </Button>
    </>
  );

  const result = content[status];

  return (
    <Dialog.Root
      open={isOpen}
      size='md'
      placement='center'
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius='md' mx={4}>
            <Dialog.Header pr={12}>
              <Dialog.Title fontSize='lg' fontWeight={700} color='gray.800'>
                {UPLOAD_TITLE}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger top={4} right={4} asChild>
              <CloseButton size='sm' />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              {result ? result.body : renderForm}
              {/* The Upload button's label is replaced by a spinner while
                  uploading, so announce the in-progress state separately. */}
              <Text role='status' srOnly>
                {status === STATUS.UPLOADING ? UPLOAD_IN_PROGRESS : ''}
              </Text>
            </Dialog.Body>
            <Dialog.Footer gap={3}>
              {result ? result.footer : formFooter}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default UploadModal;
