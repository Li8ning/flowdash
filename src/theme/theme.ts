import { extendTheme, theme as baseTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: '#3182CE',
    accent: baseTheme.colors.teal,
    background: baseTheme.colors.gray,
    surface: baseTheme.colors.white,
    textPrimary: baseTheme.colors.gray,
    textSecondary: baseTheme.colors.gray,
    success: baseTheme.colors.green,
    warning: baseTheme.colors.yellow,
    danger: baseTheme.colors.red,
    lightBorder: baseTheme.colors.gray,
  },
};

const theme = extendTheme({
  colors,
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: 'brand.background',
        color: 'brand.textSecondary',
        fontFamily: 'body',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'lg',
        boxShadow: 'sm',
        px: { base: 3, md: 4, lg: 6 }, // Granular responsive padding
      },
      // Removed custom variants to allow colorScheme props to work properly
      // The custom solid variant was overriding all colorScheme functionality
    },
    Input: {
      variants: {
        outline: {
          field: {
            _focus: {
              borderColor: 'brand.primary',
              boxShadow: `0 0 0 1px ${colors.brand.primary}`,
            },
          },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'brand.textPrimary',
        fontWeight: 'bold',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            bg: 'gray.100',
            fontWeight: 'bold',
            color: 'brand.textPrimary',
          },
        },
      },
    },
    Tabs: {
      variants: {
        'line-alt': {
          tablist: {
            borderBottom: '2px solid',
            borderColor: 'brand.lightBorder',
          },
          tab: {
            fontWeight: 'semibold',
            color: 'brand.textSecondary',
            borderBottom: '2px solid transparent',
            py: 3,
            px: 5,
            transition: 'all 0.2s',
            _selected: {
              color: 'brand.primary',
              borderColor: 'brand.primary',
            },
            _hover: {
              bg: 'gray.100',
              borderColor: 'gray.300',
            },
            _active: {
              bg: 'gray.200',
            }
          },
        },
      },
    },
  },
});

export default theme;