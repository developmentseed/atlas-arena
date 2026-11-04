import { useState } from 'react';
import { Box, Button, Flex, Heading, Table, Text } from '@chakra-ui/react';
import { useJobMetrics } from '@/components/explore/useJobMetrics';
import {
  METRICS_PERFORMANCE_LABEL,
  METRICS_IMPORTANCE_LABEL,
  METRICS_LOADING,
  METRICS_ERROR,
  METRICS_SHOW_ALL,
  METRICS_SHOW_FEWER,
  METRICS_SPLITS,
  METRICS_NAMES,
  METRICS_MODEL_NAMES,
} from '@/config/constants/constants.explore';

// Basic display of a finished run's stats, for restyling: all the data comes
// from useJobMetrics, and this file only decides how it looks.

const TOP_FEATURES = 10;

const modelName = (id) => METRICS_MODEL_NAMES[id] || id;

const formatStat = ({ mean, std } = {}, digits = 2) => {
  if (mean == null) return '–';
  const value = mean.toFixed(digits);
  return std == null ? value : `${value} ± ${std.toFixed(digits)}`;
};

const SectionHeading = ({ children }) => (
  <Heading
    as='h2'
    fontSize='xs'
    fontWeight={600}
    letterSpacing='0.5px'
    color='gray.600'
    lineHeight='short'
    textTransform='uppercase'
  >
    {children}
  </Heading>
);

// One table per split (held-out test, cross-validation): a row per metric, a
// column per model.
const PerformanceTable = ({ models, split }) => (
  <Table.Root size='sm' aria-label={split.label}>
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeader px={1}>{split.label}</Table.ColumnHeader>
        {models.map(({ id }) => (
          <Table.ColumnHeader key={id} px={1} textAlign='end'>
            {modelName(id)}
          </Table.ColumnHeader>
        ))}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {Object.entries(METRICS_NAMES).map(([metric, name]) => (
        <Table.Row key={metric}>
          <Table.Cell px={1}>{name}</Table.Cell>
          {models.map(({ id, metrics }) => (
            <Table.Cell
              key={id}
              px={1}
              textAlign='end'
              fontVariantNumeric='tabular-nums'
              whiteSpace='nowrap'
            >
              {formatStat(metrics[`${split.prefix}_${metric}`])}
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  </Table.Root>
);

// Bars are scaled to the model's largest importance.
const ImportanceBars = ({ model, rows }) => {
  const max = rows[0]?.mean || 1;
  return (
    <Box>
      <Text as='h3' fontSize='xs' fontWeight={600} color='gray.700' mb={1}>
        {modelName(model)}
      </Text>
      <Flex as='ul' direction='column' gap='2px' listStyleType='none'>
        {rows.map((row) => (
          <Flex
            as='li'
            key={row.feature}
            align='center'
            gap={2}
            fontSize='xs'
            title={`${row.feature}: ${formatStat(row, 3)}`}
          >
            <Text w='3.5rem' flexShrink={0} color='gray.700' truncate>
              {row.feature}
            </Text>
            <Box flex={1} minW={0} aria-hidden='true'>
              <Box
                h='10px'
                w={`${Math.max((row.mean / max) * 100, 0)}%`}
                bg='blue.500'
                borderRightRadius='4px'
              />
            </Box>
            <Text color='gray.600' fontVariantNumeric='tabular-nums'>
              {row.mean.toFixed(3)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

const JobMetrics = ({ jobId }) => {
  const { metrics, loading, error } = useJobMetrics(jobId);
  const [showAll, setShowAll] = useState(false);

  if (loading || error) {
    return (
      <Text fontSize='xs' color='gray.600'>
        {error ? METRICS_ERROR : METRICS_LOADING}
      </Text>
    );
  }
  // Older jobs have no summary tables.
  if (!metrics) return null;

  const { models, importances } = metrics;
  const importanceEntries = Object.entries(importances);
  const hasMore = importanceEntries.some(
    ([, rows]) => rows.length > TOP_FEATURES
  );

  return (
    <Flex direction='column' gap={3}>
      {models.length > 0 && (
        <Flex direction='column' gap={2}>
          <SectionHeading>{METRICS_PERFORMANCE_LABEL}</SectionHeading>
          {METRICS_SPLITS.map((split) => (
            <PerformanceTable
              key={split.prefix}
              models={models}
              split={split}
            />
          ))}
        </Flex>
      )}
      {importanceEntries.length > 0 && (
        <Flex direction='column' gap={2}>
          <SectionHeading>{METRICS_IMPORTANCE_LABEL}</SectionHeading>
          {importanceEntries.map(([model, rows]) => (
            <ImportanceBars
              key={model}
              model={model}
              rows={showAll ? rows : rows.slice(0, TOP_FEATURES)}
            />
          ))}
          {hasMore && (
            <Button
              size='xs'
              variant='ghost'
              colorPalette='blue'
              alignSelf='flex-start'
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? METRICS_SHOW_FEWER : METRICS_SHOW_ALL}
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
};

export default JobMetrics;
