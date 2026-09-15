/**
 * SweetAlert Component & Global Alert Interceptor for React Native / Expo
 * Transforms default native alerts into custom animated SweetAlert popups.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert as RNAlert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BrandColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface SweetAlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface SweetAlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: SweetAlertButton[];
}

type AlertListener = (options: SweetAlertOptions | null) => void;

let alertListener: AlertListener | null = null;

export const SweetAlert = {
  show(options: SweetAlertOptions) {
    if (alertListener) {
      alertListener(options);
    }
  },
  success(title: string, message?: string, onConfirm?: () => void) {
    this.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: onConfirm }],
    });
  },
  error(title: string, message?: string, onConfirm?: () => void) {
    this.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: onConfirm }],
    });
  },
  warning(title: string, message?: string, onConfirm?: () => void) {
    this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', onPress: onConfirm }],
    });
  },
  confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    this.show({
      title,
      message,
      type: 'question',
      buttons: [
        { text: 'Cancel', onPress: onCancel, style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm, style: 'default' },
      ],
    });
  },
  fireAlert(title: string, message?: string, buttons?: any[]) {
    let type: AlertType = 'info';
    const lowerTitle = (title || '').toLowerCase();

    if (
      lowerTitle.includes('success') ||
      lowerTitle.includes('🎉') ||
      lowerTitle.includes('saved') ||
      lowerTitle.includes('updated') ||
      lowerTitle.includes('activated') ||
      lowerTitle.includes('found') ||
      lowerTitle.includes('detected')
    ) {
      type = 'success';
    } else if (
      lowerTitle.includes('error') ||
      lowerTitle.includes('failed') ||
      lowerTitle.includes('denied') ||
      lowerTitle.includes('restricted')
    ) {
      type = 'error';
    } else if (
      lowerTitle.includes('warning') ||
      lowerTitle.includes('validation') ||
      lowerTitle.includes('required') ||
      lowerTitle.includes('delete') ||
      lowerTitle.includes('notice')
    ) {
      type = 'warning';
    }

    const formattedButtons: SweetAlertButton[] =
      Array.isArray(buttons) && buttons.length > 0
        ? buttons.map((b) => ({
            text: b.text || 'OK',
            onPress: b.onPress,
            style: b.style,
          }))
        : [{ text: 'OK' }];

    this.show({
      title,
      message,
      type,
      buttons: formattedButtons,
    });
  },
};

// Global interceptor for RN Native Alert.alert
const originalRNAlert = RNAlert.alert;
RNAlert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  SweetAlert.fireAlert(title, message, buttons);
};

export function SweetAlertContainer() {
  const [options, setOptions] = useState<SweetAlertOptions | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0.85));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    alertListener = (opts) => {
      setOptions(opts);
      if (opts) {
        scaleAnim.setValue(0.85);
        opacityAnim.setValue(0);
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    return () => {
      alertListener = null;
    };
  }, []);

  if (!options) return null;

  const handleButtonPress = (btn: SweetAlertButton) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOptions(null);
      if (btn.onPress) {
        btn.onPress();
      }
    });
  };

  const type = options.type || 'info';

  const getIconProps = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981', bg: '#ECFDF5' };
      case 'error':
        return { name: 'close-circle' as const, color: '#EF4444', bg: '#FEF2F2' };
      case 'warning':
        return { name: 'warning' as const, color: '#F59E0B', bg: '#FFFBEB' };
      case 'question':
        return { name: 'help-circle' as const, color: '#3B82F6', bg: '#EFF6FF' };
      default:
        return { name: 'information-circle' as const, color: '#F59E0B', bg: '#FFFBEB' };
    }
  };

  const iconInfo = getIconProps();
  const buttons = options.buttons && options.buttons.length > 0 ? options.buttons : [{ text: 'OK' }];

  return (
    <Modal transparent visible={Boolean(options)} animationType="none">
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.dialogCard, { transform: [{ scale: scaleAnim }] }]}>
          {/* Badge Icon */}
          <View style={[styles.iconBadge, { backgroundColor: iconInfo.bg }]}>
            <Ionicons name={iconInfo.name} size={38} color={iconInfo.color} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{options.title}</Text>
          {Boolean(options.message) && <Text style={styles.message}>{options.message}</Text>}

          {/* Actions */}
          <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonColumn]}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.btn,
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                    !isCancel && !isDestructive && styles.btnPrimary,
                    buttons.length === 1 && { width: '100%' },
                  ]}
                  onPress={() => handleButtonPress(btn)}>
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnTextCancel,
                      (isDestructive || !isCancel) && styles.btnTextPrimary,
                    ]}>
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D4',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E1B18',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6E675F',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPrimary: {
    backgroundColor: '#F59E0B',
  },
  btnCancel: {
    backgroundColor: '#F0EDE4',
    borderWidth: 1,
    borderColor: '#E5E0D4',
  },
  btnDestructive: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
  btnTextCancel: {
    color: '#1E1B18',
  },
});
