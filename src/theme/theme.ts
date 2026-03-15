'use client'

import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a1a',
      paper: '#1a1a2e',
    },
    primary: {
      main: '#00d4ff',
      contrastText: '#000000',
    },
    secondary: {
      main: '#b24bff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8892b0',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a1a',
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00d4ff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00d4ff',
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.4)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 212, 255, 0.3)',
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&.Mui-selected': {
            backgroundColor: '#00d4ff',
            color: '#000000',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.2)',
          },
        },
      },
    },
  },
})
