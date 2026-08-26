import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

interface PortfolioReel {
  id: string;
  title: string;
  url: string;
  views: string;
}

interface PortfolioImage {
  id: string;
  title: string;
  url: string;
}

export default function CreatorPortfolioScreen() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reels' | 'images'>('reels');
  const [reels, setReels] = useState<PortfolioReel[]>([]);
  const [images, setImages] = useState<PortfolioImage[]>([]);

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/creator/portfolio');
      const data = res.data?.data || res.data || {};
      setReels(data.reels || []);
      setImages(data.images || []);
    } catch (err) {
      console.warn('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleAddItem = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      Alert.alert('Required', 'Please fill in both title and media URL');
      return;
    }
    setSubmitting(true);
    try {
      if (activeTab === 'reels') {
        await api.post('/creator/portfolio/reels', { title: newTitle.trim(), videoUrl: newUrl.trim() });
      } else {
        await api.post('/creator/portfolio/images', { title: newTitle.trim(), url: newUrl.trim() });
      }
      Alert.alert('Success', 'Portfolio item added successfully!');
      setModalVisible(false);
      setNewTitle('');
      setNewUrl('');
      fetchPortfolio();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add portfolio item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/creator/portfolio/${activeTab}/${id}`);
            Alert.alert('Deleted', 'Portfolio item removed');
            fetchPortfolio();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR PORTFOLIO</Text>
          <Text style={styles.headerSub}>Video Reels & Shoot Gallery</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color={BLACK} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabHeaderRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reels' && styles.tabBtnActive]}
          onPress={() => setActiveTab('reels')}>
          <Text style={[styles.tabBtnText, activeTab === 'reels' && styles.tabBtnTextActive]}>
            Video Reels ({reels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'images' && styles.tabBtnActive]}
          onPress={() => setActiveTab('images')}>
          <Text style={[styles.tabBtnText, activeTab === 'images' && styles.tabBtnTextActive]}>
            Photos Gallery ({images.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {(activeTab === 'reels' ? reels : images).length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="film-outline" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No portfolio items added yet</Text>
          </View>
        ) : (
          (activeTab === 'reels' ? reels : images).map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemUrl} numberOfLines={1}>
                  {(item as any).url}
                </Text>
                {(item as any).views ? <Text style={styles.itemViews}>{(item as any).views}</Text> : null}
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {activeTab === 'reels' ? 'Sample Video Reel' : 'Photo Gallery Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Title / Caption *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Brand Promo Shoot"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.modalLabel}>
              {activeTab === 'reels' ? 'Video Reel MP4 / Drive Link *' : 'Image URL Link *'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newUrl}
              onChangeText={setNewUrl}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddItem} disabled={submitting}>
              {submitting ? <ActivityIndicator color={BLACK} /> : <Text style={styles.modalSubmitText}>Save to Portfolio</Text>}
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: BLACK },
  loadingContainer: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  addBtn: { width: 36, height: 36, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  tabHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: YELLOW },
  tabBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, fontWeight: '700' },
  tabBtnTextActive: { color: YELLOW, fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  itemCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  itemTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  itemUrl: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  itemViews: { color: YELLOW, fontSize: 10, fontWeight: '700', marginTop: 2 },
  deleteBtn: { padding: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.four },
  modalContent: { backgroundColor: DARK_CARD, borderWidth: 2, borderColor: YELLOW, padding: Spacing.five, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  modalLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  modalInput: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  modalSubmitBtn: { backgroundColor: YELLOW, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  modalSubmitText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
});
