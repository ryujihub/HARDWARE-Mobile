// Complete React Native Paper theme with all required properties
export const lightTheme = {
  dark: false,
  roundness: 4,
  version: 3,
  isV3: true,
  colors: {
    primary: 'rgb(0, 122, 255)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(227, 242, 253)',
    onPrimaryContainer: 'rgb(21, 101, 192)',
    secondary: 'rgb(46, 125, 50)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(232, 245, 233)',
    onSecondaryContainer: 'rgb(27, 94, 32)',
    tertiary: 'rgb(245, 124, 0)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(255, 243, 224)',
    onTertiaryContainer: 'rgb(229, 97, 0)',
    error: 'rgb(198, 40, 40)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 235, 238)',
    onErrorContainer: 'rgb(183, 28, 28)',
    background: 'rgb(250, 250, 250)',
    onBackground: 'rgb(28, 27, 31)',
    surface: 'rgb(255, 255, 255)',
    onSurface: 'rgb(28, 27, 31)',
    surfaceVariant: 'rgb(245, 245, 245)',
    onSurfaceVariant: 'rgb(73, 69, 79)',
    outline: 'rgb(121, 116, 126)',
    outlineVariant: 'rgb(202, 196, 208)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(49, 48, 51)',
    inverseOnSurface: 'rgb(244, 239, 244)',
    inversePrimary: 'rgb(79, 195, 247)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(247, 243, 249)',
      level2: 'rgb(243, 237, 246)',
      level3: 'rgb(238, 232, 244)',
      level4: 'rgb(236, 230, 243)',
      level5: 'rgb(233, 227, 241)'
    },
    surfaceDisabled: 'rgba(28, 27, 31, 0.12)',
    onSurfaceDisabled: 'rgba(28, 27, 31, 0.38)',
    backdrop: 'rgba(50, 47, 55, 0.4)'
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400'
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500'
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300'
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100'
    }
  },
  animation: {
    scale: 1.0
  }
};

// Dark theme
export const darkTheme = {
  dark: true,
  roundness: 4,
  version: 3,
  isV3: true,
  colors: {
    primary: 'rgb(79, 195, 247)',
    onPrimary: 'rgb(0, 50, 88)',
    primaryContainer: 'rgb(21, 101, 192)',
    onPrimaryContainer: 'rgb(204, 231, 255)',
    secondary: 'rgb(102, 187, 106)',
    onSecondary: 'rgb(0, 58, 0)',
    secondaryContainer: 'rgb(46, 125, 50)',
    onSecondaryContainer: 'rgb(200, 230, 201)',
    tertiary: 'rgb(255, 183, 77)',
    onTertiary: 'rgb(69, 43, 0)',
    tertiaryContainer: 'rgb(245, 124, 0)',
    onTertiaryContainer: 'rgb(255, 224, 178)',
    error: 'rgb(239, 83, 80)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(198, 40, 40)',
    onErrorContainer: 'rgb(255, 218, 214)',
    background: 'rgb(18, 18, 18)',
    onBackground: 'rgb(230, 225, 229)',
    surface: 'rgb(28, 27, 31)',
    onSurface: 'rgb(230, 225, 229)',
    surfaceVariant: 'rgb(73, 69, 79)',
    onSurfaceVariant: 'rgb(202, 196, 208)',
    outline: 'rgb(147, 143, 153)',
    outlineVariant: 'rgb(73, 69, 79)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(230, 225, 229)',
    inverseOnSurface: 'rgb(49, 48, 51)',
    inversePrimary: 'rgb(0, 122, 255)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(35, 35, 39)',
      level2: 'rgb(40, 40, 44)',
      level3: 'rgb(45, 45, 49)',
      level4: 'rgb(47, 47, 51)',
      level5: 'rgb(50, 50, 54)'
    },
    surfaceDisabled: 'rgba(230, 225, 229, 0.12)',
    onSurfaceDisabled: 'rgba(230, 225, 229, 0.38)',
    backdrop: 'rgba(50, 47, 55, 0.4)'
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400'
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500'
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300'
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100'
    }
  },
  animation: {
    scale: 1.0
  }
};

// Default export
export const theme = lightTheme;