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
import { useAuth } from '@/features/auth/context';

export default function InquiriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuth();

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

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inquiries & Quotes</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.centered}>
          <Ionicons name="help-circle-outline" size={64} color={BrandColors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16 }}>Sign In to View Inquiries</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 20 }}>
            Please sign in to your BizReels account to track inquiries, request custom quotes, and converse with suppliers.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: BrandColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>Log In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BLACK,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
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
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 0,
    marginTop: Spacing.two,
  },
  browseBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
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
    borderRadius: 0,
  },
  listingThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  vendorName: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  subjectText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  statusBadge: {
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statusBadgeReplied: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  statusBadgeText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
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
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  viewThreadText: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    padding: Spacing.four,
    maxHeight: '80%',
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
    flex: 1,
  },
  threadBox: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  threadSubject: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  msgBubbleCustomer: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: Spacing.two,
    borderRadius: 0,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  msgBubbleVendor: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.two,
    borderRadius: 0,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  msgSenderName: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
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
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
  },
  replyInput: {
    flex: 1,
    backgroundColor: BLACK,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 0,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
