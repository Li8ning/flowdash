import { extendTheme, theme as baseTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    primary: baseTheme.colors.blue[600],
    accent: baseTheme.colors.teal[500],
    background: baseTheme.colors.gray[50],
    surface: baseTheme.colors.white,
    textPrimary: baseTheme.colors.gray[800],
    textSecondary: baseTheme.colors.gray[600],
    success: baseTheme.colors.green[500],
    warning: baseTheme.colors.yellow[500],
    danger: baseTheme.colors.red[500],
    lightBorder: baseTheme.colors.gray[200],
  },
};

const theme = extendTheme({
  colors,
  styles: {
    global: {
      'html, body': {
        bg: 'brand.background',
        color: 'brand.textSecondary',
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
      variants: {
        solid: (props: any) => {
          const { colorScheme: c } = props;
          if (c === 'green') {
            return {
              bg: 'brand.success',
              color: 'white',
              _hover: { bg: baseTheme.colors.green[600] },
            };
          }
          if (c === 'red') {
            return {
              bg: 'brand.danger',
              color: 'white',
              _hover: { bg: baseTheme.colors.red[600] },
            };
          }
          return {
            bg: 'brand.primary',
            color: 'white',
            _hover: { bg: baseTheme.colors.blue[700] },
          };
        },
        outline: {
          borderColor: 'brand.primary',
          color: 'brand.primary',
        },
      },
      defaultProps: {
        variant: 'solid',
        colorScheme: 'blue', // Keep a default
      },
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
  },
});

export default theme;