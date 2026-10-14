import { View, type ViewProps, type ViewStyle } from 'react-native';
import { spacing, type SpacingToken } from '../theme/tokens';

export interface StackProps extends ViewProps {
  gap?: SpacingToken;
  padding?: SpacingToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  flex?: number;
  wrap?: boolean;
}

function makeStack(direction: 'row' | 'column') {
  return function Stack({
    gap = 'none',
    padding,
    align,
    justify,
    flex,
    wrap,
    style,
    ...rest
  }: StackProps) {
    return (
      <View
        style={[
          {
            flexDirection: direction,
            gap: spacing[gap],
            padding: padding ? spacing[padding] : undefined,
            alignItems: align,
            justifyContent: justify,
            flex,
            flexWrap: wrap ? 'wrap' : undefined,
          },
          style,
        ]}
        {...rest}
      />
    );
  };
}

export const VStack = makeStack('column');
export const HStack = makeStack('row');
