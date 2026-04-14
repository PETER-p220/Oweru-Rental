// Responsive Breakpoints and Utilities
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  large: '1200px',
} as const;

export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  large: `@media (min-width: ${breakpoints.large})`,
} as const;

// Responsive spacing utilities
export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

// Responsive font sizes
export const fontSizes = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '24px',
  xxl: '32px',
  xxxl: '40px',
} as const;

// Mixins for common responsive patterns
export const mixins = {
  flexCenter: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  
  flexBetween: `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  
  card: `
    background: var(--navy-800);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: var(--spacing-lg);
    transition: all 0.3s;
  `,
  
  mobileCard: `
    background: var(--navy-800);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: var(--spacing-md);
    transition: all 0.3s;
  `,
  
  button: `
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: 8px;
    font-size: var(--fontSizes-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  `,
  
  mobileButton: `
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--fontSizes-md);
  `,
} as const;
