import { useMemo, useState } from 'react';
import {
  Combobox,
  Field,
  Portal,
  createListCollection,
  useFilter,
} from '@chakra-ui/react';
import FormLabelFlex from '@/components/custom/FormLabelFlex';

// Single-select picker with typeahead. Clearing it falls back to
// defaultValue, so there is always a selection.
// handleAction is called with the selected option's key.
const FormControlComboboxVirus = ({
  label,
  options,
  handleAction,
  value = '',
  defaultValue,
  info = '',
  isDisabled = false,
}) => {
  // Text typed by the user. The input also shows the selected item's name,
  // which shouldn't filter the list, so only typing updates this.
  const [searchValue, setSearchValue] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });

  const collection = useMemo(
    () =>
      createListCollection({
        items: options.filter((item) => contains(item.name, searchValue)),
        itemToString: (item) => item.name,
        itemToValue: (item) => item.key,
      }),
    [options, searchValue, contains]
  );

  const handleValueChange = (details) => {
    handleAction(details.value[0] || defaultValue);
  };

  return (
    <Field.Root py={2} disabled={isDisabled}>
      <FormLabelFlex label={label} info={info} isDisabled={isDisabled} />
      <Combobox.Root
        size='sm'
        width='full'
        collection={collection}
        value={value ? [value] : []}
        onValueChange={handleValueChange}
        onInputValueChange={(details) => {
          setSearchValue(
            details.reason === 'input-change' ? details.inputValue : ''
          );
        }}
        onOpenChange={(details) => {
          if (details.open && details.reason !== 'input-change') {
            setSearchValue('');
          }
        }}
        disabled={isDisabled}
        openOnClick
        positioning={{ sameWidth: true }}
      >
        <Combobox.Control>
          <Combobox.Input
            bg='white'
            borderColor='gray.200'
            placeholder='Search viruses…'
          />
          <Combobox.IndicatorGroup>
            {value && value !== defaultValue && <Combobox.ClearTrigger />}
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>No matching viruses</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item key={item.key} item={item}>
                  {item.name}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </Field.Root>
  );
};
export default FormControlComboboxVirus;
