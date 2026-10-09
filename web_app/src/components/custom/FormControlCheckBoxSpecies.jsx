import { ALL_VIRUS } from '@/config/constants/general';
import { Stack, Checkbox, Text, Field } from '@chakra-ui/react';
import FormLabelFlex from '@/components/custom/FormLabelFlex';
import { useId } from 'react';

// handleAction is called with the toggled option's key.
const FormControlCheckBoxSpecies = ({
  label,
  options,
  handleAction,
  values = [],
  filterValue = ALL_VIRUS,
  info = '',
  isDisabled = false,
  isLocked = false,
  notice = '',
  noticeId,
}) => {
  const headingId = useId();
  if (!options.length) return null;

  // filter
  const renderOptions = options.map((item) => {
    let isDisabledTmp = false;
    if (filterValue === ALL_VIRUS) {
      isDisabledTmp = false;
    } else {
      isDisabledTmp = !(item.virus || []).includes(filterValue);
    }

    return (
      <Checkbox.Root
        key={item.key}
        size='sm'
        colorPalette='blue'
        checked={values.includes(item.name)}
        onCheckedChange={() => handleAction(item.key)}
        disabled={isDisabled || isLocked || isDisabledTmp}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label fontWeight='normal'>{item.name}</Checkbox.Label>
      </Checkbox.Root>
    );
  });

  return (
    <Field.Root
      my={4}
      disabled={isDisabled}
      role='group'
      aria-labelledby={headingId}
      aria-describedby={notice ? noticeId : undefined}
    >
      <FormLabelFlex
        id={headingId}
        label={label}
        info={info}
        isDisabled={isDisabled}
        isGroup
      />
      {notice && (
        <Text id={noticeId} fontSize='sm' fontWeight={600} color='blue.600'>
          {notice}
        </Text>
      )}
      <Stack pl={0} mt={1} gap={1}>
        {renderOptions}
      </Stack>
    </Field.Root>
  );
};
export default FormControlCheckBoxSpecies;
