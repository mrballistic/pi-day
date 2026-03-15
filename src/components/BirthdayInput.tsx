// src/components/BirthdayInput.tsx
'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface BirthdayInputProps {
  onSearch: (date: Date) => void
  disabled?: boolean
}

export default function BirthdayInput({ onSearch, disabled = false }: BirthdayInputProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateError, setDateError] = useState(false)

  const today = new Date()
  const isValidDate = selectedDate !== null && selectedDate <= today && !dateError

  const handleSearch = () => {
    if (isValidDate && selectedDate) {
      onSearch(selectedDate)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
          px: 3,
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Pi Hero */}
        <Typography
          component="div"
          sx={{
            fontSize: { xs: '120px', sm: '160px', md: '220px' },
            fontWeight: 900,
            lineHeight: 1,
            animation: 'piGlow 4s ease-in-out infinite',
            mb: 2,
            userSelect: 'none',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              color: 'var(--neon-blue)',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
            },
          }}
          aria-hidden="true"
        >
          π
        </Typography>

        {/* Headline */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
            textAlign: 'center',
            mb: 1.5,
            textShadow: '0 0 30px rgba(255,255,255,0.3)',
          }}
        >
          Find Your Birthday in π
        </Typography>

        {/* Subheadline */}
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            maxWidth: 480,
            mb: 4,
            fontSize: { xs: '1rem', md: '1.1rem' },
            lineHeight: 1.6,
          }}
        >
          Every birthday is hiding somewhere in the infinite digits of pi. Let&apos;s find yours.
        </Typography>

        {/* Date Picker */}
        <Box sx={{ width: '100%', maxWidth: 360, mb: 3 }}>
          <DatePicker
            label="Your Birthday"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            maxDate={today}
            onError={(err) => setDateError(err !== null)}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                inputProps: { 'aria-label': 'Birthday date' },
              },
              popper: {
                sx: {
                  '& .MuiPaper-root': {
                    background: '#1a1a2e',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                  },
                },
              },
            }}
          />
        </Box>

        {/* CTA Button */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSearch}
          disabled={!isValidDate || disabled}
          aria-label="Search pi for your birthday"
          sx={{
            px: 5,
            py: 1.5,
            borderRadius: '50px',
            fontSize: '1.1rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00d4ff, #b24bff)',
            boxShadow: '0 0 24px rgba(0, 212, 255, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.05)',
              boxShadow: '0 0 36px rgba(0, 212, 255, 0.6)',
              background: 'linear-gradient(135deg, #00d4ff, #b24bff)',
            },
            '&:disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          Search π
        </Button>
      </Box>
    </LocalizationProvider>
  )
}
