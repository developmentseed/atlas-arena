import { FormLabel, Flex } from '@chakra-ui/react';
import InfoTooltip from '@/components/custom/InfoTooltip';

const FormLabelFlex = ({ label, info, isDisabled = false }) => {
  if (!label) return null;
  return (
    <FormLabel fontSize='xs' fontWeight={600} letterSpacing="0.5px" color="gray.600" textTransform='uppercase'>
      <Flex justifyContent='space-between' alignItems='center'>
        {label}
        <InfoTooltip label={info} props={{ isDisabled: isDisabled }} />
      </Flex>
    </FormLabel>
  );
};
export default FormLabelFlex;
