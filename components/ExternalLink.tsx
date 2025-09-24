import { openBrowserAsync } from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Linking, Platform, Text, TouchableOpacity } from 'react-native';

type Props = {
  href: string;
  children: ReactNode;
  accessibilityLabel?: string;
};

export function ExternalLink({ href, children, accessibilityLabel }: Props) {
  const onPress = async () => {
    try {
      if (Platform.OS === 'web') {
        window.open(href, '_blank', 'noopener');
        return;
      }
      // prefer Expo's in-app browser when available
      if (openBrowserAsync) {
        await openBrowserAsync(href);
        return;
      }
      await Linking.openURL(href);
    } catch (e) {
      console.warn('Failed to open link', href, e);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}
