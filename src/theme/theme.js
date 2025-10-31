import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    primaryContainer: '#E3F2FD',
    secondary: '#2E7D32',
    secondaryContainer: '#E8F5E9',
    tertiary: '#F57C00',
    tertiaryContainer: '#FFF3E0',
    error: '#C62828',
    errorContainer: '#FFEBEE',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onError: '#FFFFFF',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4FC3F7',
    primaryContainer: '#1565C0',
    secondary: '#66BB6A',
    secondaryContainer: '#2E7D32',
    tertiary: '#FFB74D',
    tertiaryContainer: '#F57C00',
    error: '#EF5350',
    errorContainer: '#C62828',
  },
};
