import { RadioGroup } from '@chakra-ui/react';

// A segmented-button style radio. Render inside a RadioGroup.Root.
const RadioCard = ({ value, isFirst, children }) => {
  const customBorders = isFirst
    ? {
        borderLeftRadius: '4px',
        borderRightRadius: '0px',
      }
    : {
        borderLeftRadius: '0px',
        borderRightRadius: '4px',
      };
  return (
    <RadioGroup.Item value={value} flex={isFirst ? 1 : undefined}>
      <RadioGroup.ItemHiddenInput />
      <RadioGroup.ItemText
        {...customBorders}
        w='full'
        cursor='pointer'
        borderWidth='1px'
        borderColor='blue.700'
        color='blue.700'
        fontSize='xs'
        fontWeight='semibold'
        _checked={{
          bg: 'blue.50',
        }}
        _focusVisible={{
          boxShadow: 'outline',
        }}
        p={2}
      >
        {children}
      </RadioGroup.ItemText>
    </RadioGroup.Item>
  );
};

export default RadioCard;
