import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ children, onPress, style, ...rest }: Props) {
  return (
    <Pressable
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      {...rest}
    >
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.97 : 1 }}
          transition={{ type: 'timing', duration: 120 }}
          style={style}
        >
          {children}
        </MotiView>
      )}
    </Pressable>
  );
}
