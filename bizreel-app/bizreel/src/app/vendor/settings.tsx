/**
 * Vendor Store Settings & Close Schedule Screen with SMS OTP Security.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import {
  useSendVendorSettingsOtp,
  useUpdateVendorSettings,
  useVendorSettings,
} from '@/features/vendor/queries';

export default function VendorSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: settings, isLoading } = useVendorSettings();
  const sendOtpMutation = useSendVendorSettingsOtp();
  const updateSettingsMutation = useUpdateVendorSettings();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [autoResponseNote, setAutoResponseNote] = useState('');
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(false);
  const [closeScheduleReason, setCloseScheduleReason] = useState('');

  // OTP Modal state
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setCategory(settings.category || '');
      setAddress(settings.address || '');
      setAutoResponseNote(settings.autoResponseNote || '');
      setIsTemporaryClosed(!!settings.isTemporaryClosed);
      setCloseScheduleReason(settings.closeScheduleReason || '');
    }
  }, [settings]);

  function handleSaveTrigger() {
    sendOtpMutation.mutate(undefined, {
      onSuccess: (data) => {
        Alert.alert(
          'Security OTP Sent',
          `SMS OTP sent to ${data.phone}. Use ${data.otp || 'code'} in development.`
        );
        if (data.otp) setOtpCode(data.otp);
        setOtpModalVisible(true);
      },
      onError: (err: any) => Alert.alert('Error', err.message),
    });
  }

  function handleConfirmSave() {
    if (!consentGiven) {
      Alert.alert('Consent Required', 'Please check the consent box to confirm updates.');
      return;
    }
    if (!otpCode.trim()) {
      Alert.alert('OTP Required', 'Please enter the SMS OTP sent to your phone.');
      return;
    }

    updateSettingsMutation.mutate(
      {
        settings: {
          businessName,
          category,
          address,
          autoResponseNote,
          isTemporaryClosed,
          closeScheduleReason,
        },
        otp: otpCode.trim(),
        consentGiven: true,
      },
      {
        onSuccess: () => {
          Alert.alert('Settings Saved', 'Business profile settings updated successfully.');
          setOtpModalVisible(false);
          setOtpCode('');
        },
        onError: (err: any) => Alert.alert('Update Failed', err.message),
      }
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store & Business Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* General Information */}
          <Text style={styles.sectionTitle}>Business Profile Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Business / Shop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Electronics Store"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Primary Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Electronics & Hardware"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={category}
              onChangeText={setCategory}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Business Address</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Full shop address and city"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>

          {/* Auto Response */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer Auto-Response Note</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Auto note sent to customer inquiries..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={autoResponseNote}
              onChangeText={setAutoResponseNote}
              multiline
            />
          </View>

          {/* Store Close Schedule */}
          <Text style={styles.sectionTitle}>Store Operating Status</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Temporary Store Close Schedule</Text>
              <Text style={styles.switchSub}>
                Mark store as temporarily closed to pause incoming orders
              </Text>
            </View>
            <Switch
              value={isTemporaryClosed}
              onValueChange={setIsTemporaryClosed}
              trackColor={{ false: '#2c2c2e', true: BrandColors.primary }}
            />
          </View>

          {isTemporaryClosed && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Closure Reason / Reopen Date</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Closed for renovations till Sunday"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={closeScheduleReason}
                onChangeText={setCloseScheduleReason}
              />
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveTrigger}
            disabled={sendOtpMutation.isPending}>
            {sendOtpMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Business Settings</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* OTP Security Confirmation Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOtpModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Authorize Settings Update</Text>
            <Text style={styles.modalSub}>
              For security, enter the SMS OTP sent to your registered mobile number to confirm profile changes.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit Security OTP"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setConsentGiven((v) => !v)}>
              <Ionicons
                name={consentGiven ? 'checkbox' : 'square-outline'}
                size={22}
                color={consentGiven ? BrandColors.primary : 'rgba(255,255,255,0.5)'}
              />
              <Text style={styles.consentText}>
                I confirm these business profile and store settings changes.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmSave}
              disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm & Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  sectionTitle: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  switchLabel: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  switchSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  modalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  consentText: {
    color: '#fff',
    fontSize: FontSize.xs,
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
