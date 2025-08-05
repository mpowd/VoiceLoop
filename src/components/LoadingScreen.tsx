import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { loadingStyles } from '../styles/components';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Model loading...',
}) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={loadingStyles.container}>
      <Animated.View
        style={[
          loadingStyles.content,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={loadingStyles.dots}>
          <View style={[loadingStyles.dot, loadingStyles.dot1]} />
          <View style={[loadingStyles.dot, loadingStyles.dot2]} />
          <View style={[loadingStyles.dot, loadingStyles.dot3]} />
        </View>
        <Text style={loadingStyles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export default LoadingScreen;
