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
      main: '#68462f',
      light: '#98745b',
      dark: '#392719',
    },
    secondary: {
      main: '#c89a62',
      light: '#e2c49b',
      dark: '#9e7040',
    },
    background: {
      default: '#f7f4ef',
      paper: '#fffdfa',
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
          border: '1px solid rgba(104, 70, 47, 0.08)',
          borderRadius: 20,
          backgroundImage: 'linear-gradient(145deg, #fffefa 0%, #fffdfa 70%, #fbf7f1 100%)',
          boxShadow: '0 8px 28px rgba(57, 39, 25, 0.055)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            boxShadow: '0 14px 36px rgba(57, 39, 25, 0.09)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: 'rgba(104, 70, 47, 0.09)',
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
          backgroundColor: '#fffefa',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(104, 70, 47, 0.17)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#98745b',
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
          backgroundColor: '#f6f1e9',
          '& .MuiTableCell-root': {
            color: '#6b5745',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.055em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(104, 70, 47, 0.1)',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(104, 70, 47, 0.08)',
          paddingTop: 13,
          paddingBottom: 13,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(104, 70, 47, 0.1)',
          boxShadow: '0 24px 80px rgba(57, 39, 25, 0.2)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(104, 70, 47, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(110deg, #392719 0%, #68462f 60%, #79583c 100%)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f7f4ef',
          backgroundImage:
            'radial-gradient(ellipse at 12% 0%, rgba(216, 190, 157, 0.18), transparent 34%), radial-gradient(ellipse at 92% 8%, rgba(104, 70, 47, 0.05), transparent 28%)',
          backgroundAttachment: 'fixed',
        },
        '::selection': {
          backgroundColor: 'rgba(200, 154, 98, 0.32)',
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(104, 70, 47, 0.23)',
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
