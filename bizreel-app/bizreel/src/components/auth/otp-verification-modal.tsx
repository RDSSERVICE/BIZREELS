import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { useSendOtp, useVerifyOtp } from '@/features/auth/mutations';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

interface OtpVerificationModalProps {
  visible: boolean;
  phone: string;
  email?: string;
  name?: string;
  role?: 'customer' | 'vendor' | 'creator';
  autoLogin?: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
}

export function OtpVerificationModal({
  visible,
  phone,
  email,
  name,
  role = 'customer',
  autoLogin = true,
  onClose,
  onSuccess,
}: OtpVerificationModalProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(30);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp(autoLogin);
  const { mutate: sendOtp, isPending: isSending } = useSendOtp();

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any;
    if (visible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible, timer]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtpDigits(['', '', '', '', '', '']);
      setTimer(30);
      setErrorMsg(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  const handleOtpChange = (text: string, index: number) => {
    setErrorMsg(null);

    // Handle pasting complete 6-digit code
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto focus next box
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setErrorMsg(null);
    verifyOtp(
      {
        phone,
        otp,
        name,
        email,
        role,
      },
      {
        onSuccess: () => {
          onSuccess({ otp });
        },
        onError: (err) => {
          setErrorMsg(err.message || 'OTP verification failed. Please try again.');
        },
      }
    );
  };

  const handleResend = () => {
    if (timer > 0 || isSending) return;

    setErrorMsg(null);
    sendOtp(
      { phone },
      {
        onSuccess: () => {
          setTimer(30);
          setOtpDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
        onError: (err) => {
          setErrorMsg(err.message || 'Failed to resend OTP.');
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.headerTitleGroup}>
              <Ionicons name="shield-checkmark" size={24} color={YELLOW} />
              <Text style={s.title}>VERIFY OTP</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={s.subheading}>
            We sent a 6-digit OTP code to <Text style={s.highlight}>{phone}</Text>
            {email ? ` & ${email}` : ''}. Enter it below to complete registration.
          </Text>

          {/* Error Banner */}
          {errorMsg && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={BrandColors.error} />
              <Text style={s.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* 6-Digit OTP Box Grid */}
          <View style={s.otpGrid}>
            {otpDigits.map((digit, index) => (
              <TextInput
                key={`otp-${index}`}
                ref={(ref: any) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  s.otpBox,
                  digit ? s.otpBoxFilled : null,
                  errorMsg ? s.otpBoxError : null,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Resend Timer */}
          <View style={s.resendRow}>
            <Text style={s.resendText}>Didn't receive the code? </Text>
            {timer > 0 ? (
              <Text style={s.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isSending}>
                <Text style={s.resendLink}>
                  {isSending ? 'Sending...' : 'RESEND OTP NOW'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Action Button */}
          <Pressable
            style={({ pressed }) => [
              s.verifyButton,
              pressed && s.verifyButtonPressed,
              isVerifying && s.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isVerifying}>
            {isVerifying ? (
              <ActivityIndicator color={BLACK} />
            ) : (
              <>
                <Text style={s.verifyButtonText}>VERIFY & COMPLETE</Text>
                <Ionicons name="arrow-forward" size={18} color={BLACK} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: Spacing.one,
  },
  subheading: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  highlight: {
    color: YELLOW,
    fontWeight: '900',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: '#EF4444',
    lineHeight: 16,
    fontWeight: '700',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  otpBox: {
    flex: 1,
    height: 52,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  timerText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  resendLink: {
    fontSize: FontSize.xs,
    color: YELLOW,
    fontWeight: '900',
  },
  verifyButton: {
    backgroundColor: YELLOW,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  verifyButtonPressed: {
    opacity: 0.8,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: BLACK,
    fontSize: FontSize.base,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
