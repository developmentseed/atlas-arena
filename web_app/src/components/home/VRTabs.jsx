import NextLink from 'next/link';
import React from 'react';
import { Tabs, Card, Box, SimpleGrid, Text, Link } from '@chakra-ui/react';

const CustomCard = ({ title = '', subTitle = '', href = '' }) => {
  return (
    <Card.Root variant='withImageHeader' size='md'>
      <Card.Header>
        <Box
          position='absolute'
          bottom='0'
          display='flex'
          flexDirection='column'
          justifyContent='flex-end'
          alignItems='start'
          color='white'
          p={2}
        >
          <Link fontSize='md' color='blue.900' fontWeight={700} asChild>
            <NextLink href={`/explore`}>{title}</NextLink>
          </Link>
          <Text fontSize='md' color='blue.900'>
            {subTitle}
          </Text>
        </Box>
      </Card.Header>
    </Card.Root>
  );
};

const VRTabs = ({ virus = [], species = [] }) => {
  const renderViruses =
    virus &&
    virus.map((item) => (
      <CustomCard
        key={item.name}
        title={item.name}
        subTitle={`${(item.species || []).length}  reservoir species`}
      />
    ));
  const renderSpecies =
    species &&
    species.map((item) => (
      <CustomCard key={item.name} title={item.name} subTitle={item.virus} />
    ));

  return (
    <Tabs.Root unstyled defaultValue='viruses'>
      <Tabs.List justifyContent='center'>
        <Tabs.Trigger value='viruses'>VIRUSES</Tabs.Trigger>
        <Tabs.Trigger value='reservoirs'>RESERVOIRS</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value='viruses'>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 3 }} gap={4} px={0}>
          {renderViruses}
        </SimpleGrid>
      </Tabs.Content>
      <Tabs.Content value='reservoirs'>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 3 }} gap={4} px={0}>
          {renderSpecies}
        </SimpleGrid>
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default VRTabs;
