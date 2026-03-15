import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Button = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon = null,
  style,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = styles.button;
    const variantStyle = styles[`button_${variant}`];
    const sizeStyle = styles[`button_${size}`];

    return [baseStyle, variantStyle, sizeStyle, style];
  };

  const getTextStyle = () => {
    return [styles.buttonText, styles[`text_${variant}`]];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color="#fff" style={styles.icon} />}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  button_primary: {
    backgroundColor: '#2196F3',
  },
  button_secondary: {
    backgroundColor: '#757575',
  },
  button_success: {
    backgroundColor: '#4CAF50',
  },
  button_danger: {
    backgroundColor: '#f44336',
  },
  button_large: {
    paddingVertical: 16,
  },
  button_medium: {
    paddingVertical: 12,
  },
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  text_primary: {
    color: '#fff',
  },
  text_secondary: {
    color: '#fff',
  },
  text_success: {
    color: '#fff',
  },
  text_danger: {
    color: '#fff',
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;
