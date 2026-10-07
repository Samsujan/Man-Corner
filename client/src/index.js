import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#9b7015',
      light: '#c59a32',
      dark: '#60450d',
    },
    secondary: {
      main: '#d3ad35',
      light: '#efd878',
      dark: '#9a7417',
    },
    background: {
      default: '#fff9e8',
      paper: '#fffdf4',
    },
    success: {
      main: '#54745c',
      light: '#e8f0e8',
    },
    error: {
      main: '#b85f4b',
      light: '#fbefeb',
    },
    text: {
      primary: '#332a23',
      secondary: '#82766a',
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      letterSpacing: '-0.035em',
    },
    h2: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(146, 111, 25, 0.12)',
          borderRadius: 20,
          backgroundImage: 'linear-gradient(145deg, #fffef9 0%, #fffdf4 70%, #fbf4dc 100%)',
          boxShadow: '0 8px 28px rgba(80, 61, 16, 0.06)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            boxShadow: '0 14px 36px rgba(80, 61, 16, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: 'rgba(146, 111, 25, 0.12)',
        },
        rounded: {
          borderRadius: 18,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(57, 39, 25, 0.14)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#fffdf4',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(146, 111, 25, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#c59a32',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 9,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8efcf',
          '& .MuiTableCell-root': {
            color: '#705b1a',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.055em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(146, 111, 25, 0.16)',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(146, 111, 25, 0.1)',
          paddingTop: 13,
          paddingBottom: 13,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(146, 111, 25, 0.14)',
          boxShadow: '0 24px 80px rgba(80, 61, 16, 0.2)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(146, 111, 25, 0.14)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(110deg, #3c2d0c 0%, #725614 60%, #92701c 100%)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff9e8',
          backgroundImage:
            'radial-gradient(ellipse at 12% 0%, rgba(244, 213, 119, 0.23), transparent 34%), radial-gradient(ellipse at 92% 8%, rgba(179, 139, 35, 0.07), transparent 28%)',
          backgroundAttachment: 'fixed',
        },
        '::selection': {
          backgroundColor: 'rgba(211, 173, 53, 0.35)',
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(146, 111, 25, 0.28)',
          borderRadius: 8,
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
