import { ALL_VIRUS } from '@/config/constants/general';
import { FormControl, Stack, Checkbox, Text } from '@chakra-ui/react';
import FormLabelFlex from '@/components/custom/FormLabelFlex';

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
      <Checkbox
        isChecked={values.includes(item.name)}
        onChange={handleAction}
        key={item.key}
        id={item.key}
        size="sm"
        isDisabled={isDisabled || isLocked || isDisabledTmp}
      >
        {item.name}
      </Checkbox>
    );
  });

  return (
    <FormControl
      my={4}
      isDisabled={isDisabled}
      aria-describedby={notice ? noticeId : undefined}
    >
      <FormLabelFlex label={label} info={info} isDisabled={isDisabled} />
      {notice && (
        <Text id={noticeId} fontSize='sm' fontWeight={600} color='blue.600'>
          {notice}
        </Text>
      )}
      <Stack pl={0} mt={1} spacing={1}>
        {renderOptions}
      </Stack>
    </FormControl>
  );
};
export default FormControlCheckBoxSpecies;
