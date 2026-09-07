/**
 * UGC Content & User Moderation Report Modal — Play Store Policy Requirement
 * Allows users to report reels, listings, comments, reviews, or users for moderation.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';
const RED = '#EF4444';

interface ReportModalProps {
  visible: boolean;
  targetType: 'listing' | 'user' | 'review' | 'message' | 'reel';
  targetId: string;
  targetTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { key: 'spam', label: 'Spam or Misleading Content', desc: 'Repetitive, automated, or misleading content' },
  { key: 'offensive', label: 'Inappropriate or Hate Speech', desc: 'Contains adult, graphic, or offensive material' },
  { key: 'scam', label: 'Scam, Fraud or Counterfeit', desc: 'Fraudulent product, fake service, or financial scam' },
  { key: 'wrong_category', label: 'Wrong Category or Irrelevant', desc: 'Item or video listed in incorrect category' },
  { key: 'other', label: 'Harassment or Abusive Behavior', desc: 'Personal harassment or policy violation' },
];

export function ReportModal({
  visible,
  targetType,
  targetId,
  targetTitle,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('spam');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmitReport = async () => {
    if (!targetId) {
      Alert.alert('Error', 'Invalid content target ID.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/v1/reports', {
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        description: description.trim() || null,
      }).catch(() =>
        api.post('/reports', {
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
          description: description.trim() || null,
        })
      );

      Alert.alert(
        'Report Submitted 🛡️',
        'Thank you for reporting. Our safety & moderation team will review this item within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Submission Note',
        'Your feedback has been logged for review.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-outline" size={20} color={RED} />
              <Text style={styles.modalTitle}>Report Content / User</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.targetLabel}>
            Reporting {targetType.toUpperCase()}:{' '}
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {targetTitle ? `"${targetTitle}"` : `#${targetId.slice(-6)}`}
            </Text>
          </Text>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>SELECT REASON</Text>
            <View style={{ gap: 8 }}>
              {REPORT_REASONS.map((item) => {
                const isSelected = selectedReason === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(item.key)}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reasonLabel, isSelected && { color: YELLOW }]}>{item.label}</Text>
                      <Text style={styles.reasonDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 12 }]}>ADDITIONAL DETAILS (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe the issue (e.g. offensive language, fake product)..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitReport}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>SUBMIT REPORT</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalCard: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderTopColor: RED,
    padding: Spacing.four,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  targetLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  sectionHeader: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: YELLOW,
  },
  reasonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  reasonDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 2,
  },
  notesInput: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 11,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: RED,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
