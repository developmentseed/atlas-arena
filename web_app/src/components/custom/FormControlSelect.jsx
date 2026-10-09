import { NativeSelect, Field } from '@chakra-ui/react';
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
    <Field.Root py={2} disabled={isDisabled}>
      <FormLabelFlex label={label} info={info} isDisabled={isDisabled} />
      <NativeSelect.Root size='sm' disabled={isDisabled || isLocked}>
        <NativeSelect.Field
          bg='white'
          borderColor='gray.200'
          value={value}
          onChange={handleAction}
          aria-describedby={isLocked ? describedBy : undefined}
        >
          {options.map((i) => (
            <option key={i.key} value={i.key}>
              {i.name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
};
export default FormControlSelect;
