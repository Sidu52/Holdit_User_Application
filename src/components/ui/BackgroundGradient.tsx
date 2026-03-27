import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundGradientProps {
  children: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  bottomColor: string;
  style?: ViewStyle;
}

const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  primaryColor,
  secondaryColor,
  bottomColor,
  style,
}) => {
  return (
    <LinearGradient
      colors={[primaryColor, secondaryColor, bottomColor]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BackgroundGradient;
