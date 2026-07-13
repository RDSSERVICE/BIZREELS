import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Switch, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import GradientButton from '@/src/components/GradientButton';
import GlassCard from '@/src/components/GlassCard';
import { categoryApi, listingApi, mediaApi, resolveMediaUrl, userApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { storage } from '@/src/utils/storage';
import { colors, borderRadius } from '@/src/lib/theme';

const DRAFT_KEY = 'emergent_listing_draft';
const STEPS = ['type', 'category', 'details', 'media', 'location', 'review'];
const TYPE_META = [
  { key: 'new_product', icon: 'cube-outline' as const, label: 'New Product', desc: 'Brand new item to sell' },
  { key: 'old_product', icon: 'bag-outline' as const, label: 'Used Product', desc: 'Pre-owned item in good condition' },
  { key: 'service', icon: 'construct-outline' as const, label: 'Service', desc: 'Offer your professional services' },
];
const CONDITION_OPTS = ['new', 'like_new', 'good', 'fair'];
const CHARGES_OPTS = ['fixed', 'hourly', 'per_visit'];

const emptyForm = {
  type: 'new_product',
  title: '',
  description: '',
  category_id: '',
  sub_category_id: '',
  price: '',
  offer_price: '',
  is_negotiable: false,
  bulk_price: '',
  stock: '',
  condition: '',
  warranty: '',
  service_charges_type: '',
  experience_years: '',
  service_area_km: '',
  images: [] as any[],
  reel: null as any,
  location: { area: '', city: '', state: '', pincode: '', address: '', lat: null as number | null, lng: null as number | null },
  tags: '',
};

type FormType = typeof emptyForm;

export default function CreateListing() {
  const router = useRouter();
  const { user, updateLocalUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormType>(emptyForm);
  const [topCats, setTopCats] = useState<any[]>([]);
  const [subCats, setSubCats] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showBecomeVendor, setShowBecomeVendor] = useState(false);
  const [becomingVendor, setBecomingVendor] = useState(false);
  const draftTimer = useRef<any>(null);

  // Load categories
  useEffect(() => {
    categoryApi.list({ tree: true }).then(({ data }) => setTopCats(data.items || [])).catch(() => {});
  }, []);

  // Restore draft
  useEffect(() => {
    (async () => {
      try {
        const raw = await storage.getItem(DRAFT_KEY, '');
        if (raw) setForm(typeof raw === 'string' ? JSON.parse(raw) : raw);
      } catch {}
    })();
  }, []);

  // Sub-cats when category picked
  useEffect(() => {
    const parent = topCats.find((c) => c.id === form.category_id);
    setSubCats(parent?.children || []);
  }, [form.category_id, topCats]);

  // Auto-save draft
  useEffect(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      try { await storage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
    }, 500);
    return () => clearTimeout(draftTimer.current);
  }, [form]);

  const patch = (u: Partial<FormType>) => setForm((f) => ({ ...f, ...u }));
  const patchLoc = (u: any) => setForm((f) => ({ ...f, location: { ...f.location, ...u } }));

  const validateStep = (): boolean => {
    if (step === 0) return !!form.type;
    if (step === 1) {
      if (!form.category_id) { Alert.alert('Error', 'Pick a category'); return false; }
      return true;
    }
    if (step === 2) {
      if (!form.title || form.title.length < 3) { Alert.alert('Error', 'Title too short'); return false; }
      if (!Number(form.price) || Number(form.price) <= 0) { Alert.alert('Error', 'Enter a valid price'); return false; }
      if (form.offer_price && Number(form.offer_price) >= Number(form.price)) { Alert.alert('Error', 'Offer < price'); return false; }
      if (form.type === 'new_product' && (form.stock === '' || Number(form.stock) < 0)) { Alert.alert('Error', 'Stock required'); return false; }
      if (form.type === 'old_product' && !form.condition) { Alert.alert('Error', 'Condition required'); return false; }
      if (form.type === 'service' && !form.service_charges_type) { Alert.alert('Error', 'Charges type required'); return false; }
      return true;
    }
    if (step === 4) {
      if (!form.location.area || !form.location.city || !form.location.pincode) {
        Alert.alert('Error', 'Area, city and pincode required');
        return false;
      }
      return true;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { if (step > 0) setStep((s) => s - 1); else router.back(); };

  // Media: pick images
  const pickImages = async () => {
    if (form.images.length >= 10) { Alert.alert('Limit', 'Max 10 images'); return; }
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - form.images.length,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploadingImg(true);
    try {
      const uploaded: any[] = [];
      for (const asset of result.assets) {
        const formData = new FormData();
        const ext = asset.uri.split('.').pop() || 'jpg';
        formData.append('file', { uri: asset.uri, name: `photo.${ext}`, type: asset.mimeType || 'image/jpeg' } as any);
        formData.append('folder', `listings/${user?.id || 'misc'}`);
        formData.append('resource_type', 'image');
        const { data } = await mediaApi.upload(formData);
        uploaded.push({ url: data.url, public_id: data.public_id, width: data.width, height: data.height });
      }
      patch({ images: [...form.images, ...uploaded] });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Upload failed');
    } finally { setUploadingImg(false); }
  };

  const removeImg = (idx: number) => {
    patch({ images: form.images.filter((_, i) => i !== idx) });
  };

  // Location
  const useMyLocation = async () => {
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      patchLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert('Success', 'Location captured');
    } catch { Alert.alert('Error', 'Could not get location'); }
  };

  // Publish
  const buildBody = (f: FormType) => ({
    type: f.type,
    title: f.title.trim(),
    description: f.description?.trim() || undefined,
    category_id: f.category_id,
    sub_category_id: f.sub_category_id || undefined,
    price: Number(f.price),
    offer_price: f.offer_price ? Number(f.offer_price) : undefined,
    is_negotiable: !!f.is_negotiable,
    bulk_price: f.bulk_price ? Number(f.bulk_price) : undefined,
    stock: f.type === 'new_product' ? Number(f.stock) : undefined,
    condition: f.type === 'old_product' ? f.condition : undefined,
    warranty: f.type === 'new_product' && f.warranty ? f.warranty : undefined,
    service_charges_type: f.type === 'service' ? f.service_charges_type : undefined,
    experience_years: f.experience_years ? Number(f.experience_years) : undefined,
    service_area_km: f.service_area_km ? Number(f.service_area_km) : undefined,
    images: f.images,
    reel: f.reel || undefined,
    location: { ...f.location },
    tags: (typeof f.tags === 'string' ? f.tags.split(',') : f.tags || []).map((t: string) => t.trim()).filter(Boolean),
  });

  const publish = async () => {
    setPublishing(true);
    try {
      const body = buildBody(form);
      let res;
      try {
        res = await listingApi.create(body, false);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setShowBecomeVendor(true);
          return;
        }
        throw err;
      }
      await storage.removeItem(DRAFT_KEY);
      Alert.alert('Published!', 'Your listing is now live');
      router.replace(`/listing/${res.data.slug}`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to publish');
    } finally { setPublishing(false); }
  };

  const handleBecomeVendor = async () => {
    setBecomingVendor(true);
    try {
      const { data } = await userApi.addRole('vendor');
      updateLocalUser(data.user);
      setShowBecomeVendor(false);
      // Retry publish
      const body = buildBody(form);
      const res = await listingApi.create(body, true);
      await storage.removeItem(DRAFT_KEY);
      Alert.alert('Published!', 'Your listing is now live');
      router.replace(`/listing/${res.data.slug}`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed');
    } finally { setBecomingVendor(false); }
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="form-back-link" onPress={back} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Listing</Text>
          <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={['#a855f7', '#ec4899', '#f97316']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` as any }]}
              testID="form-progress"
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* STEP 0: Type */}
          {step === 0 && (
            <View style={styles.stepContent} testID="step-type">
              <Text style={styles.stepTitle}>What are you listing?</Text>
              {TYPE_META.map(({ key, icon, label, desc }) => {
                const active = form.type === key;
                return (
                  <TouchableOpacity
                    key={key}
                    testID={`type-${key}`}
                    onPress={() => patch({ type: key })}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    activeOpacity={0.7}
                  >
                    {active ? (
                      <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.typeIcon}>
                        <Ionicons name={icon} size={20} color="#fff" />
                      </LinearGradient>
                    ) : (
                      <View style={styles.typeIconPlain}>
                        <Ionicons name={icon} size={20} color="rgba(255,255,255,0.7)" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.typeLabel}>{label}</Text>
                      <Text style={styles.typeDesc}>{desc}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color="#ec4899" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* STEP 1: Category */}
          {step === 1 && (
            <View style={styles.stepContent} testID="step-category">
              <Text style={styles.stepTitle}>Pick a category</Text>
              <Text style={styles.sectionLabel}>CATEGORY</Text>
              <View style={styles.chipGrid}>
                {topCats.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    testID={`category-opt-${c.slug}`}
                    onPress={() => patch({ category_id: c.id, sub_category_id: '' })}
                    style={[styles.catChip, form.category_id === c.id && styles.catChipActive]}
                  >
                    <Text style={[styles.catChipText, form.category_id === c.id && styles.catChipTextActive]}>
                      {c.icon_url || ''} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {subCats.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SUB-CATEGORY</Text>
                  <View style={styles.chipGrid}>
                    {subCats.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        testID={`sub-cat-opt-${s.slug}`}
                        onPress={() => patch({ sub_category_id: s.id === form.sub_category_id ? '' : s.id })}
                        style={[styles.catChip, form.sub_category_id === s.id && styles.catChipActive]}
                      >
                        <Text style={[styles.catChipText, form.sub_category_id === s.id && styles.catChipTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <View style={styles.stepContent} testID="step-details">
              <Text style={styles.stepTitle}>Listing details</Text>
              <Field label="Title">
                <TextInput testID="title-input" style={styles.input} value={form.title} onChangeText={t => patch({ title: t })} maxLength={120} placeholder="e.g. OnePlus 12, 128GB" placeholderTextColor="rgba(255,255,255,0.3)" />
              </Field>
              <Field label="Description">
                <TextInput testID="description-input" style={[styles.input, styles.textarea]} value={form.description} onChangeText={t => patch({ description: t })} multiline placeholder="Describe your item..." placeholderTextColor="rgba(255,255,255,0.3)" />
              </Field>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Price (₹)">
                    <TextInput testID="price-input" style={styles.input} value={form.price} onChangeText={t => patch({ price: t.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="0" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Offer Price (₹)">
                    <TextInput testID="offer-price-input" style={styles.input} value={form.offer_price} onChangeText={t => patch({ offer_price: t.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="optional" placeholderTextColor="rgba(255,255,255,0.3)" />
                  </Field>
                </View>
              </View>
              <GlassCard style={styles.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Negotiable</Text>
                  <Text style={styles.switchDesc}>Let buyers propose a price</Text>
                </View>
                <Switch testID="negotiable-switch" value={form.is_negotiable} onValueChange={v => patch({ is_negotiable: v })} trackColor={{ true: '#ec4899', false: 'rgba(255,255,255,0.15)' }} thumbColor="#fff" />
              </GlassCard>

              {form.type === 'new_product' && (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}><Field label="Stock"><TextInput testID="stock-input" style={styles.input} value={form.stock} onChangeText={t => patch({ stock: t.replace(/\D/g, '') })} keyboardType="number-pad" /></Field></View>
                  <View style={{ flex: 1 }}><Field label="Warranty"><TextInput testID="warranty-input" style={styles.input} value={form.warranty} onChangeText={t => patch({ warranty: t })} placeholder="e.g. 1 year" placeholderTextColor="rgba(255,255,255,0.3)" /></Field></View>
                </View>
              )}
              {form.type === 'old_product' && (
                <View>
                  <Text style={styles.sectionLabel}>CONDITION</Text>
                  <View style={styles.chipGrid}>
                    {CONDITION_OPTS.map(c => (
                      <TouchableOpacity key={c} testID={`cond-${c}`} onPress={() => patch({ condition: c })} style={[styles.catChip, form.condition === c && styles.catChipActive]}>
                        <Text style={[styles.catChipText, form.condition === c && styles.catChipTextActive]}>{c.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {form.type === 'service' && (
                <>
                  <Text style={styles.sectionLabel}>CHARGES TYPE</Text>
                  <View style={styles.chipGrid}>
                    {CHARGES_OPTS.map(c => (
                      <TouchableOpacity key={c} testID={`charges-${c}`} onPress={() => patch({ service_charges_type: c })} style={[styles.catChip, form.service_charges_type === c && styles.catChipActive]}>
                        <Text style={[styles.catChipText, form.service_charges_type === c && styles.catChipTextActive]}>{c.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}><Field label="Experience (years)"><TextInput testID="exp-input" style={styles.input} value={form.experience_years} onChangeText={t => patch({ experience_years: t.replace(/\D/g, '') })} keyboardType="number-pad" /></Field></View>
                    <View style={{ flex: 1 }}><Field label="Service area (km)"><TextInput testID="area-input" style={styles.input} value={form.service_area_km} onChangeText={t => patch({ service_area_km: t.replace(/\D/g, '') })} keyboardType="number-pad" /></Field></View>
                  </View>
                </>
              )}
              <Field label="Tags (comma-separated)">
                <TextInput testID="tags-input" style={styles.input} value={form.tags} onChangeText={t => patch({ tags: t })} placeholder="e.g. mobile, 5g" placeholderTextColor="rgba(255,255,255,0.3)" />
              </Field>
            </View>
          )}

          {/* STEP 3: Media */}
          {step === 3 && (
            <View style={styles.stepContent} testID="step-media">
              <Text style={styles.stepTitle}>Add photos</Text>
              <Text style={styles.sectionLabel}>IMAGES ({form.images.length}/10)</Text>
              <View style={styles.mediaGrid}>
                {form.images.map((img, i) => (
                  <View key={img.public_id || i} style={styles.mediaThumb}>
                    <Image source={{ uri: resolveMediaUrl(img.url) }} style={styles.mediaImg} contentFit="cover" />
                    <TouchableOpacity testID={`remove-image-${i}`} onPress={() => removeImg(i)} style={styles.mediaRemove}>
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.images.length < 10 && (
                  <TouchableOpacity testID="upload-image-btn" onPress={pickImages} disabled={uploadingImg} style={styles.mediaAdd}>
                    {uploadingImg ? (
                      <ActivityIndicator color="#ec4899" />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={24} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.mediaAddText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* STEP 4: Location */}
          {step === 4 && (
            <View style={styles.stepContent} testID="step-location">
              <Text style={styles.stepTitle}>Location</Text>
              <TouchableOpacity testID="use-location-btn" onPress={useMyLocation} style={styles.locBtn}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text style={styles.locBtnText}>Use my location</Text>
              </TouchableOpacity>
              {form.location.lat && (
                <Text style={styles.locCapture}>📍 {form.location.lat.toFixed(4)}, {form.location.lng?.toFixed(4)}</Text>
              )}
              <Field label="Area / Locality"><TextInput testID="area-locality-input" style={styles.input} value={form.location.area} onChangeText={t => patchLoc({ area: t })} placeholder="e.g. Koramangala" placeholderTextColor="rgba(255,255,255,0.3)" /></Field>
              <View style={styles.row}>
                <View style={{ flex: 1 }}><Field label="City"><TextInput testID="city-input" style={styles.input} value={form.location.city} onChangeText={t => patchLoc({ city: t })} placeholderTextColor="rgba(255,255,255,0.3)" /></Field></View>
                <View style={{ flex: 1 }}><Field label="Pincode"><TextInput testID="pincode-input" style={styles.input} value={form.location.pincode} onChangeText={t => patchLoc({ pincode: t.replace(/\D/g, '').slice(0, 6) })} keyboardType="number-pad" placeholderTextColor="rgba(255,255,255,0.3)" /></Field></View>
              </View>
              <Field label="State (optional)"><TextInput testID="state-input" style={styles.input} value={form.location.state} onChangeText={t => patchLoc({ state: t })} placeholderTextColor="rgba(255,255,255,0.3)" /></Field>
              <Field label="Address (optional)"><TextInput testID="address-input" style={[styles.input, styles.textarea]} value={form.location.address} onChangeText={t => patchLoc({ address: t })} multiline placeholderTextColor="rgba(255,255,255,0.3)" /></Field>
            </View>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <View style={styles.stepContent} testID="step-review">
              <Text style={styles.stepTitle}>Review & Publish</Text>
              <GlassCard style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>{form.title || '(no title)'}</Text>
                <Text style={styles.reviewType}>{form.type.replace(/_/g, ' ')}</Text>
                <View style={styles.reviewPriceRow}>
                  <Text style={styles.reviewPrice}>₹{Number(form.offer_price || form.price || 0).toLocaleString('en-IN')}</Text>
                  {form.offer_price && <Text style={styles.reviewOldPrice}>₹{Number(form.price).toLocaleString('en-IN')}</Text>}
                </View>
                {form.description ? <Text style={styles.reviewDesc}>{form.description}</Text> : null}
                <Text style={styles.reviewLoc}>
                  {form.location.area}, {form.location.city} · {form.location.pincode}
                </Text>
                {form.images.length > 0 && (
                  <View style={styles.reviewImages}>
                    {form.images.slice(0, 4).map((im, i) => (
                      <View key={i} style={styles.reviewImgThumb}>
                        <Image source={{ uri: resolveMediaUrl(im.url) }} style={styles.reviewImg} contentFit="cover" />
                      </View>
                    ))}
                    {form.images.length > 4 && <Text style={styles.reviewMore}>+{form.images.length - 4}</Text>}
                  </View>
                )}
              </GlassCard>
              <Text style={styles.publishNote}>Everything looks good? Publish to make it visible to buyers immediately.</Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky footer */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity testID="form-back-btn" onPress={back} style={styles.footerOutline}>
              <Text style={styles.footerOutlineText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <GradientButton testID="form-next-btn" title="Next" onPress={next} style={{ flex: 1 }} />
          ) : (
            <GradientButton testID="form-publish-btn" title={publishing ? 'Publishing...' : 'Publish'} onPress={publish} disabled={publishing} loading={publishing} style={{ flex: 1 }} />
          )}
        </View>

        {/* Become Vendor Modal */}
        <Modal visible={showBecomeVendor} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Become a Vendor</Text>
              <Text style={styles.modalDesc}>To publish listings, you need vendor access. It&apos;s free and takes 2 seconds.</Text>
              <GradientButton testID="become-vendor-confirm" title={becomingVendor ? 'Setting up...' : 'Yes, become a vendor'} onPress={handleBecomeVendor} loading={becomingVendor} disabled={becomingVendor} />
              <TouchableOpacity testID="become-vendor-cancel" onPress={() => setShowBecomeVendor(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  progressWrap: { paddingHorizontal: 24, marginTop: 12, marginBottom: 8 },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  scrollContent: { paddingBottom: 120 },
  stepContent: { paddingHorizontal: 24, gap: 12 },
  stepTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  typeCardActive: { borderColor: 'rgba(236,72,153,0.6)', backgroundColor: 'rgba(236,72,153,0.1)' },
  typeIcon: { height: 44, width: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  typeIconPlain: { height: 44, width: 44, borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  typeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  catChipActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  catChipText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  field: { gap: 4 },
  fieldLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  input: {
    height: 48, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 15,
  },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  switchLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  switchDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaThumb: { width: '30%', aspectRatio: 1, borderRadius: borderRadius.lg, overflow: 'hidden', position: 'relative' },
  mediaImg: { width: '100%', height: '100%' },
  mediaRemove: {
    position: 'absolute', top: 4, right: 4, height: 24, width: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  mediaAdd: {
    width: '30%', aspectRatio: 1, borderRadius: borderRadius.lg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  mediaAddText: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  locBtn: {
    height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  locBtnText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  locCapture: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  reviewCard: { padding: 16 },
  reviewTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  reviewType: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', marginTop: 2 },
  reviewPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  reviewPrice: { fontSize: 20, fontWeight: '700', color: '#fff' },
  reviewOldPrice: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  reviewDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 19 },
  reviewLoc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  reviewImages: { flexDirection: 'row', gap: 4, marginTop: 12 },
  reviewImgThumb: { width: '23%', aspectRatio: 1, borderRadius: borderRadius.sm, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  reviewImg: { width: '100%', height: '100%' },
  reviewMore: { fontSize: 12, color: 'rgba(255,255,255,0.5)', alignSelf: 'center' },
  publishNote: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerOutline: {
    flex: 1, height: 56, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  footerOutlineText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: borderRadius.xl, padding: 24, gap: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  modalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});
