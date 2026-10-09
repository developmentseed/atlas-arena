import { FormControl, Select } from '@chakra-ui/react';
import FormLabelFlex from '@/components/custom/FormLabelFlex';

const FormControlSelect = ({
  label,
  options,
  handleAction,
  value = '',
  isDisabled = false,
  info = '',
  isLocked = false,
  describedBy,
}) => {
  return (
    <FormControl py={2} isDisabled={isDisabled}>
      <FormLabelFlex label={label} info={info} isDisabled={isDisabled} />
      <Select
        bg='white'
        size='sm'
        borderColor='gray.200'
        value={value}
        onChange={handleAction}
        isDisabled={isDisabled || isLocked}
        aria-describedby={isLocked ? describedBy : undefined}
      >
        {options.map((i) => (
          <option key={i.key} value={i.key}>
            {i.name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};
export default FormControlSelect;
