import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Smoothly fades and slides content into view on mount.
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 320,
  offsetY = 12,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offsetY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

interface ScalePressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pressable wrapper with subtle spring scale feedback.
 */
export function ScalePressable({
  children,
  onPress,
  disabled = false,
  scaleTo = 0.97,
  style,
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => !disabled && animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
