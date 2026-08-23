/**
 * Vendor Create Listing Screen — Publish new Product or Service.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCreateVendorListing } from '@/features/vendor-listings/queries';

export default function CreateListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<'product' | 'service'>('product');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');

  const createMutation = useCreateVendorListing();

  function handleSubmit() {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Missing Details', 'Please enter listing title and base price.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid base price.');
      return;
    }

    createMutation.mutate(
      {
        type,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: priceNum,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        stock: type === 'product' ? parseInt(stock || '1', 10) : undefined,
        image: imageUrl.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Listing Created', `${title} published to your catalog successfully!`);
          router.back();
        },
        onError: (err: any) => Alert.alert('Creation Failed', err.message),
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
        <Text style={styles.headerTitle}>Add New Listing</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type Selector (Product vs Service) */}
        <Text style={styles.sectionTitle}>Listing Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeChip, type === 'product' && styles.typeChipActive]}
            onPress={() => setType('product')}>
            <Ionicons
              name="cube"
              size={18}
              color={type === 'product' ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.typeChipText, type === 'product' && styles.typeChipTextActive]}>
              Product Item
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeChip, type === 'service' && styles.typeChipActive]}
            onPress={() => setType('service')}>
            <Ionicons
              name="construct"
              size={18}
              color={type === 'service' ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.typeChipText, type === 'service' && styles.typeChipTextActive]}>
              Service Booking
            </Text>
          </TouchableOpacity>
        </View>

        {/* Details Form */}
        <Text style={styles.sectionTitle}>Listing Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Wireless Noise-Cancelling Headphones"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Electronics, Beauty, Home"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://images.unsplash.com/photo-..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={imageUrl}
            onChangeText={setImageUrl}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Key features, specifications, and details..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Pricing & Stock */}
        <Text style={styles.sectionTitle}>Pricing & Stock</Text>
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Base Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="2999"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Sale Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="2499"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {type === 'product' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Available Stock Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  sectionTitle: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  typeChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  typeChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  typeChipTextActive: {
    color: '#fff',
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  submitBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
