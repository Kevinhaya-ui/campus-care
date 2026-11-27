import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, FontSize, Spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => !isDisabled && animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          styles[`size_${size}`],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
            size="small"
          />
        ) : (
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.mint },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  size_md: { paddingVertical: 14, paddingHorizontal: Spacing.lg },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },

  // Text
  text: { fontWeight: '600' },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.navy },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },
  text_danger: { color: Colors.white },
  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.base },
  textSize_lg: { fontSize: FontSize.lg },
});
