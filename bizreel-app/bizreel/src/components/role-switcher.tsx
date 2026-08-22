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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { switchUserRole } from '@/features/auth/api';
import { useAuth } from '@/features/auth/context';

export type UserRole = 'customer' | 'vendor' | 'creator';

const ROLES_CONFIG: Record<
  UserRole,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }
> = {
  customer: {
    label: 'Customer',
    icon: 'bag-handle',
    color: '#4A90E2',
    desc: 'Browse reels, products & buy directly',
  },
  vendor: {
    label: 'Vendor',
    icon: 'storefront',
    color: '#E91E63',
    desc: 'Manage store, products & leads',
  },
  creator: {
    label: 'Creator',
    icon: 'sparkles',
    color: '#FF9800',
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
      {/* Pill Toggle Button */}
      <TouchableOpacity
        style={[styles.rolePill, { borderColor: activeMeta.color }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Switch Role">
        <View style={[styles.roleDot, { backgroundColor: activeMeta.color }]} />
        <Text style={[styles.roleText, { color: activeMeta.color }]}>
          {activeMeta.label} Mode
        </Text>
        <Ionicons name="chevron-down" size={14} color={activeMeta.color} />
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
              <Text style={styles.drawerTitle}>Switch Profile Role</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
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
                  <View style={[styles.roleIconBox, { backgroundColor: meta.color + '20' }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleOptionTitle}>{meta.label}</Text>
                      {isSelected && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.roleOptionDesc}>{meta.desc}</Text>
                  </View>

                  {switchMutation.isPending && role === switchMutation.variables ? (
                    <ActivityIndicator color={BrandColors.primary} />
                  ) : (
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                      size={20}
                      color={isSelected ? BrandColors.primary : 'rgba(255,255,255,0.3)'}
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
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    backgroundColor: '#1c1c1e',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: Spacing.two,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.three,
  },
  roleOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(217, 154, 61, 0.1)',
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  roleOptionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  roleOptionDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
});
