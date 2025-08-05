export const colors = {
  // Background colors
  background: {
    primary: '#0f0f23',    // Main dark background
    secondary: '#1a1a2e',  // Card/modal background
    tertiary: '#16213e',   // Input/text area background
    elevated: '#374151',   // Button background
  },

  // Text colors
  text: {
    primary: '#ffffff',    // Main text
    secondary: '#64748b',  // Secondary text
    tertiary: '#94a3b8',   // Disabled/placeholder text
    accent: '#e0f2fe',     // Selected text accent
  },

  // Border colors
  border: {
    primary: '#374151',    // Main borders
    secondary: '#334155',  // Input borders
  },

  // Accent colors
  accent: {
    blue: '#3b82f6',       // Primary blue
    green: '#16a34a',      // Success/translate
    red: '#dc2626',        // Error/voice
    redActive: '#ef4444',  // Active voice
    yellow: '#f59e0b',     // Processing
    purple: '#8b5cf6',     // Mirror mode
    cyan: '#06b6d4',       // Accent
    gray: '#6b7280',       // Clear/neutral
    grayDisabled: '#475569', // Disabled state
  },

  // Modal overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;