import { Animated, Easing } from 'react-native';

export const fadeIn = (duration: number = 300) => ({
  fadeIn: {
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  },
});

export const slideInUp = (duration: number = 300) => ({
  slideInUp: {
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  },
});

export const slideInRight = (duration: number = 300) => ({
  slideInRight: {
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  },
});

export const scaleIn = (duration: number = 200) => ({
  scaleIn: {
    duration,
    easing: Easing.out(Easing.back(1.5)),
    useNativeDriver: true,
  },
});

export const transitionConfig = {
  duration: 300,
  timing: Animated.spring,
  springConfig: {
    damping: 20,
    stiffness: 90,
  },
};

export function createAnimatedValue(initialValue: number = 0): Animated.Value {
  return new Animated.Value(initialValue);
}

export function animateValue(
  value: Animated.Value,
  toValue: number,
  duration: number = 300,
  easing: ((value: number) => number) | undefined = Easing.out(Easing.quad)
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
}

export function animateSequence(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
  return Animated.sequence(animations);
}

export function animateParallel(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
  return Animated.parallel(animations);
}

export function createPulseAnimation(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
}
