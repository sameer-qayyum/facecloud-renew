import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { DM_Sans } from 'next/font/google';

export const dmSans = DM_Sans({
  weight: ['300', '400', '500', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#305893',
      contrastText: '#fff',
    },
    secondary: {
      main: '#2986E2',
      contrastText: '#fff',
    },
    error: {
      main: red.A400,
    },
    text: {
      primary: '#000',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          boxShadow: 'unset',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 'unset !important',
        },
      },
    },
  },
  typography: {
    fontFamily: dmSans.style.fontFamily,
  },
});

export default theme;
