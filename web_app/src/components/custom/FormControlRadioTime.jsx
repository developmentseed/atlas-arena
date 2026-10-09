import { Stack, RadioGroup, Checkbox, Field } from '@chakra-ui/react';
import { useId, useState } from 'react';
import { DEFAULT_TIME } from '@/config/constants/general';
import FormLabelFlex from '@/components/custom/FormLabelFlex';

const FormControlRadioTime = ({
  label,
  options,
  handleAction,
  info = '',
  isDisabled = false,
  isLocked = false,
  lockedValue = '',
  describedBy,
}) => {
  const [selectRadio, setSelectRadio] = useState(DEFAULT_TIME);
  const [selectCheck, setSelectCheck] = useState(false);
  const headingId = useId();

  if (!options.length) return null;

  // while locked, show the scenario the locked results were produced for
  const shownRadio = isLocked && lockedValue ? lockedValue : selectRadio;

  // filter
  const renderOptions = options
    .filter((i) => !`${i.name}`.toLowerCase().includes('delta'))
    .map((item) => {
      return (
        <RadioGroup.Item key={item.key} value={item.key}>
          <RadioGroup.ItemHiddenInput />
          <RadioGroup.ItemIndicator />
          <RadioGroup.ItemText>{item.name}</RadioGroup.ItemText>
        </RadioGroup.Item>
      );
    });
  const deltaOptions = options
    .filter((i) => `${i.name}`.toLowerCase().includes('delta'))
    .map((item) => item.name);

  // action
  const sendAction = (radioVal = '', checkVal = false) => {
    const newVal = [];

    if (!radioVal || radioVal === DEFAULT_TIME) {
      newVal.push(DEFAULT_TIME);
    } else {
      const typeSSP = radioVal.substring(0, 6).trim().toLowerCase();

      if (checkVal) {
        const filteredOption = deltaOptions.find((item) =>
          item.toLowerCase().includes(typeSSP)
        );
        if (filteredOption) {
          newVal.push(filteredOption);
        }
      } else {
        newVal.push(radioVal);
      }
    }

    handleAction([...newVal]);
  };

  const handleChangeRadio = (val) => {
    if (val == DEFAULT_TIME) {
      setSelectRadio(val);
      setSelectCheck(false);
      sendAction(val, false);
    } else {
      setSelectRadio(val);
      sendAction(val, selectCheck);
    }
  };
  const handleChangeCheck = () => {
    let newValue = !selectCheck;

    setSelectCheck(newValue);
    sendAction(selectRadio, newValue);
  };

  return (
    <Field.Root
      my={4}
      disabled={isDisabled}
      role='group'
      aria-labelledby={headingId}
      aria-describedby={isLocked ? describedBy : undefined}
    >
      <FormLabelFlex
        id={headingId}
        label={label}
        info={info}
        isDisabled={isDisabled}
        isGroup
      />
      <RadioGroup.Root
        aria-labelledby={headingId}
        size='sm'
        colorPalette='blue'
        value={shownRadio}
        onValueChange={(e) => handleChangeRadio(e.value)}
        disabled={isDisabled || isLocked}
      >
        <Stack pl={0} py={1} gap={1}>
          {renderOptions}
        </Stack>
      </RadioGroup.Root>
      <Stack pl={0} pt={2} gap={1}>
        <Checkbox.Root
          size='sm'
          colorPalette='blue'
          checked={selectCheck && !isLocked}
          onCheckedChange={handleChangeCheck}
          disabled={isLocked || selectRadio == DEFAULT_TIME}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label fontWeight='normal'>Show Delta</Checkbox.Label>
        </Checkbox.Root>
      </Stack>
    </Field.Root>
  );
};
export default FormControlRadioTime;
