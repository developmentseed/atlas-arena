import { extendTheme } from '@chakra-ui/react';
import Tabs from '@/config/styles/components.tabs';
import Card from '@/config/styles/components.card';
import Drawer from '@/config/styles/components.drawer';

const theme = extendTheme({
  breakpoints: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1440px',
    '2xl': '1920px',
  },
  colors: {
    blue: {
      50: '#DAE7F7',
      100: '#B3CDF5',
      200: '#98C0F5',
      300: '#77A9E5',
      400: '#5096F2',
      500: '#3776ED',
      600: '#3564E5',
      700: '#365AD9',
      800: '#334BB5',
      900: '#2C3F85',
    },
    secondary: {
      50: '#F9FAFA',
      100: '#eef1f2',
      200: '#dae0e2',
      300: '#bdc8cc',
      400: '#95a6ac',
      500: '#70878f',
      600: '#5b6f76',
      700: '#485a60',
      800: '#364549',
      900: '#273235',
    },
    gray: {
      50: '#f7f7f8',
      100: '#ededf1',
      200: '#d8d9df',
      300: '#b6b7c3',
      400: '#8e90a2',
      500: '#707287',
      600: '#5a5b6f',
      700: '#49495b',
      800: '#3f404d',
      900: '#383842',
    },
  },
  fonts: {
    body: `'Montserrat Variable', sans-serif`,
    heading: `'Montserrat Variable', sans-serif`,
  },
  styles: {
    global: () => ({
      body: {
        overflowX: 'hidden',
        bg: 'secondary.50',
        fontFamily: `'Montserrat Variable', sans-serif`,
      },
    }),
  },
  components: {
    Tabs,
    Card,
    Drawer,
  },
});
export default theme;
