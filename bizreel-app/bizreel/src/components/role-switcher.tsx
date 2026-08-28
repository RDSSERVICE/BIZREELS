import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { switchUserRole } from '@/features/auth/api';
import { useAuth } from '@/features/auth/context';

export type UserRole = 'customer' | 'vendor' | 'creator';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const ROLES_CONFIG: Record<
  UserRole,
  { label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }
> = {
  customer: {
    label: 'Customer',
    icon: 'bag-handle-outline',
    desc: 'Browse reels, products & buy directly',
  },
  vendor: {
    label: 'Vendor',
    icon: 'storefront-outline',
    desc: 'Manage store, products & leads',
  },
  creator: {
    label: 'Creator',
    icon: 'videocam-outline',
    desc: 'Portfolio, reels & brand hires',
  },
};

export function RoleSwitcher() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);

  const activeRole: UserRole =
    (user?.activeRole as UserRole) || (user?.current_role as UserRole) || 'customer';
  const activeMeta = ROLES_CONFIG[activeRole] || ROLES_CONFIG.customer;

  const switchMutation = useMutation({
    mutationFn: (role: UserRole) => switchUserRole(role),
    onSuccess: (updatedUser, newRole) => {
      const finalUser = {
        ...user,
        ...updatedUser,
        activeRole: newRole,
        current_role: newRole,
      } as any;
      setUser(finalUser);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setModalVisible(false);
      Alert.alert('Role Switched', `Switched to ${ROLES_CONFIG[newRole].label} mode.`);
    },
    onError: (err: any) => {
      Alert.alert('Role Switch Failed', err.message || 'Could not switch role.');
    },
  });

  const handleSelectRole = (role: UserRole) => {
    if (role === activeRole) {
      setModalVisible(false);
      return;
    }
    switchMutation.mutate(role);
  };

  return (
    <View>
      {/* Compact text chip trigger */}
      <TouchableOpacity
        style={styles.roleChip}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Switch Role">
        <Text style={styles.roleChipText}>{activeMeta.label}</Text>
        <Ionicons name="swap-horizontal-outline" size={12} color={YELLOW} />
      </TouchableOpacity>

      {/* Role Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>Switch Mode</Text>
                <Text style={styles.drawerSub}>
                  Currently active: <Text style={{ color: YELLOW }}>{activeMeta.label}</Text>
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
            </View>

            {(['customer', 'vendor', 'creator'] as const).map((role) => {
              const meta = ROLES_CONFIG[role];
              const isSelected = role === activeRole;

              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                  onPress={() => handleSelectRole(role)}
                  disabled={switchMutation.isPending}>
                  <View style={[styles.roleIconBox, isSelected && styles.roleIconBoxSelected]}>
                    <Ionicons
                      name={meta.icon}
                      size={18}
                      color={isSelected ? BLACK : 'rgba(255,255,255,0.6)'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.roleTitleRow}>
                      <Text style={[styles.roleOptionTitle, isSelected && styles.roleOptionTitleSelected]}>
                        {meta.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.roleOptionDesc}>{meta.desc}</Text>
                  </View>

                  {switchMutation.isPending && role === switchMutation.variables ? (
                    <ActivityIndicator color={YELLOW} size="small" />
                  ) : (
                    <Ionicons
                      name={isSelected ? 'checkmark' : 'chevron-forward'}
                      size={16}
                      color={isSelected ? BLACK : 'rgba(255,255,255,0.25)'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 0,
  },
  roleChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawer: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.three,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  drawerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 0,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    padding: Spacing.three,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.three,
  },
  roleOptionSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  roleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxSelected: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  roleOptionTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  roleOptionTitleSelected: {
    color: BLACK,
  },
  roleOptionDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: BLACK,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
  },
  activeTagText: {
    color: YELLOW,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
