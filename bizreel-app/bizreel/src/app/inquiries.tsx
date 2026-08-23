/**
 * Customer Inquiries & Vendor Quotes Screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useInquiries, useReplyInquiry } from '@/features/inquiries/queries';
import type { Inquiry } from '@/features/inquiries/types';

export default function InquiriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: inquiries, isLoading, refetch, isRefetching } = useInquiries();
  const replyMutation = useReplyInquiry();

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!selectedInquiry || !replyText.trim()) return;
    replyMutation.mutate(
      { inquiry_id: selectedInquiry._id, message: replyText.trim() },
      {
        onSuccess: () => {
          setReplyText('');
          setSelectedInquiry(null);
        },
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inquiries & Quotes</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : !inquiries || inquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={56} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
          <Text style={styles.emptySub}>
            When you inquire about products or custom vendor services, your active messages and quotes will appear here.
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.browseBtnText}>Explore Products & Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }
          renderItem={({ item }) => {
            const vendorName = item.vendor?.vendorProfile?.businessName || item.vendor?.name || 'Vendor';
            const listingImage = item.listing?.images?.[0];

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedInquiry(item)}>
                <View style={styles.cardHeader}>
                  {listingImage ? (
                    <Image source={{ uri: listingImage }} style={styles.listingThumb} contentFit="cover" />
                  ) : (
                    <View style={styles.listingThumbFallback}>
                      <Ionicons name="briefcase-outline" size={20} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.vendorName} numberOfLines={1}>
                      {vendorName}
                    </Text>
                    <Text style={styles.subjectText} numberOfLines={1}>
                      {item.subject || item.listing?.title || 'General Quote Inquiry'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'replied' && styles.statusBadgeReplied,
                    ]}>
                    <Text style={styles.statusBadgeText}>
                      {item.status === 'replied' ? 'Replied' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.messagePreview} numberOfLines={2}>
                  {item.message}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.viewThreadText}>View Thread ›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Inquiry Conversation Thread Modal */}
      <Modal
        visible={Boolean(selectedInquiry)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInquiry(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedInquiry(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedInquiry?.vendor?.vendorProfile?.businessName || selectedInquiry?.vendor?.name || 'Vendor Conversation'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedInquiry(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.threadBox}>
              <Text style={styles.threadSubject}>
                Subject: {selectedInquiry?.subject || selectedInquiry?.listing?.title || 'Inquiry'}
              </Text>

              {/* Initial Message */}
              <View style={styles.msgBubbleCustomer}>
                <Text style={styles.msgSenderName}>You</Text>
                <Text style={styles.msgText}>{selectedInquiry?.message}</Text>
              </View>

              {/* Replies */}
              {selectedInquiry?.replies?.map((rep, idx) => {
                const isCustomer = rep.sender === 'customer';
                return (
                  <View
                    key={idx}
                    style={isCustomer ? styles.msgBubbleCustomer : styles.msgBubbleVendor}>
                    <Text style={styles.msgSenderName}>
                      {isCustomer ? 'You' : selectedInquiry.vendor?.name || 'Vendor'}
                    </Text>
                    <Text style={styles.msgText}>{rep.message}</Text>
                  </View>
                );
              })}
            </View>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a message or reply..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendReply}
                disabled={replyMutation.isPending || !replyText.trim()}>
                {replyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    marginTop: Spacing.two,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  listingThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  listingThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  vendorName: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  subjectText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeReplied: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  messagePreview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingTop: Spacing.two,
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  viewThreadText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
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
    maxHeight: '80%',
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  threadBox: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  threadSubject: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  msgBubbleCustomer: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    padding: Spacing.two,
    borderRadius: 8,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  msgBubbleVendor: {
    backgroundColor: '#2c2c2e',
    padding: Spacing.two,
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  msgSenderName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  msgText: {
    color: '#fff',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingTop: Spacing.two,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
