import { HStack, Field, RadioGroup } from '@chakra-ui/react';
import RadioCard from '@/components/custom/RadioCard';
import { useId } from 'react';
import FormLabelFlex from '@/components/custom/FormLabelFlex';

const FormControlRadioCard = ({
  label,
  options,
  handleAction,
  value = '',
  info = '',
  isDisabled = false,
}) => {
  const headingId = useId();

  return (
    <Field.Root py={2} disabled={isDisabled} aria-labelledby={headingId}>
      <FormLabelFlex
        id={headingId}
        label={label}
        info={info}
        isDisabled={isDisabled}
        isGroup
      />
      <RadioGroup.Root
        name='view_mode'
        defaultValue={value}
        onValueChange={(e) => handleAction(e.value)}
        disabled={isDisabled}
        aria-labelledby={headingId}
      >
        <HStack gap={0}>
          {options.map((option, k) => (
            <RadioCard key={option} value={option} isFirst={k == 0}>
              {option}
            </RadioCard>
          ))}
        </HStack>
      </RadioGroup.Root>
    </Field.Root>
  );
};

export default FormControlRadioCard;
