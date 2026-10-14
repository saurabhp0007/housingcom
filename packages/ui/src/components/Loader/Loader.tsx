import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Loader() {
  const { colors } = useTheme();
  return <ActivityIndicator color={colors.primary} />;
}
