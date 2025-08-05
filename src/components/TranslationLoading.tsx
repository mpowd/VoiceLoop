import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { translationLoadingStyles } from '../styles/components';

const TranslationLoading: React.FC = () => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <View style={translationLoadingStyles.container}>
      <Animated.View
        style={[
          translationLoadingStyles.dots,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View
          style={[translationLoadingStyles.dot, translationLoadingStyles.dot1]}
        />
        <View
          style={[translationLoadingStyles.dot, translationLoadingStyles.dot2]}
        />
        <View
          style={[translationLoadingStyles.dot, translationLoadingStyles.dot3]}
        />
      </Animated.View>
      <Text style={translationLoadingStyles.text}>Translate...</Text>
    </View>
  );
};

export default TranslationLoading;
