import { useAppContext } from '@/store/context';
import Header from '@/components/Header';
import { Box, Flex } from '@chakra-ui/react';
import { useEffect } from 'react';
import { setRawData } from '@/store/actions';
import { getCatalogRows } from '@/libs/catalog';

const MainApp = ({ children }) => {
  return (
    <Box position='relative' h='100%' overflow='hidden'>
      {children}
    </Box>
  );
};

const Layout = ({ children }) => {
  const { dispatch } = useAppContext();

  useEffect(() => {
    dispatch(setRawData(getCatalogRows()));
  }, []);

  return (
    <Flex direction='column' minH='100vh' p={0} m={0}>
      <Header />
      <Flex as='main' flex='1' direction='column' overflow='hidden'>
        <MainApp>{children}</MainApp>
      </Flex>
    </Flex>
  );
};

export default Layout;
