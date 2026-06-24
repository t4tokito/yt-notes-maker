import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from './theme';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, CARD_STYLES, BUTTON_STYLES } from '../lib/designSystem';

export function ModernBottomNav({ activeTab, onTabPress }: { activeTab: string; onTabPress: (tab: string) => void }) {
  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'notes', label: 'Notes', icon: '📚' },
    { key: 'create', label: 'Create', icon: '+' },
    { key: 'chat', label: 'Chat', icon: '💬' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={NAV_STYLES.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[NAV_STYLES.tab, isActive && NAV_STYLES.activeTab]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text style={{ fontSize: 24 }}>{tab.icon}</Text>
            {isActive && (
              <View
                style={{
                  marginTop: 4,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: COLORS.primary,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ModernCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  const CardComponent = onPress ? Pressable : View;
  return (
    <CardComponent
      style={[CARD_STYLES.glassCard, style]}
      onPress={onPress}
    >
      {children}
    </CardComponent>
  );
}

export function ModernButton({ 
  children, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  style,
  textStyle
}: { 
  children: React.ReactNode; 
  onPress?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) {
  const buttonStyle = variant === 'primary' ? 
    (disabled ? BUTTON_STYLES.primaryDisabled : BUTTON_STYLES.primary) :
    variant === 'secondary' ? BUTTON_STYLES.secondary : BUTTON_STYLES.ghost;

  const ButtonComponent = onPress ? Pressable : View;
  return (
    <ButtonComponent
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[TYPOGRAPHY.button, textStyle]}>{children}</Text>
    </ButtonComponent>
  );
}

export function ModernInput({ 
  value, 
  onChangeText, 
  placeholder,
  style,
  multiline = false
}: { 
  value: string; 
  onChangeText: (text: string) => void; 
  placeholder: string;
  style?: any;
  multiline?: boolean;
}) {
  return (
    <View style={[INPUT_STYLES.textInput, style]}>
      <Text style={{ color: COLORS.textSecondary }}>{placeholder}</Text>
    </View>
  );
}

export function ModernSection({ 
  title, 
  children, 
  style,
  subtitle
}: { 
  title: string; 
  children: React.ReactNode; 
  style?: any;
  subtitle?: string;
}) {
  return (
    <View style={[{ marginBottom: SPACING.xxl }, style]}>
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={TYPOGRAPHY.h3}>{title}</Text>
        {subtitle && (
          <Text style={[TYPOGRAPHY.body2, { marginTop: SPACING.xs, color: COLORS.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {children}
    </View>
  );
}

export function ModernAvatar({ 
  source, 
  size = 40,
  style
}: { 
  source?: string; 
  size?: number;
  style?: any;
}) {
  return (
    <View
      style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
      }, style]}
    >
      <Text style={{ color: COLORS.text, fontSize: size * 0.4, fontWeight: '600' }}>
        {source ? source.charAt(0).toUpperCase() : 'U'}
      </Text>
    </View>
  );
}

export function ModernStatCard({ 
  title, 
  value, 
  icon,
  color = COLORS.primary,
  style
}: { 
  title: string; 
  value: string | number; 
  icon: string;
  color?: string;
  style?: any;
}) {
  return (
    <ModernCard style={[{ flex: 1, marginBottom: SPACING.md }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: color + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginBottom: 4 }]}>{title}</Text>
          <Text style={TYPOGRAPHY.h3}>{value}</Text>
        </View>
      </View>
    </ModernCard>
  );
}

export function ModernQuickActionCard({ 
  title, 
  subtitle, 
  icon,
  onPress,
  style
}: { 
  title: string; 
  subtitle: string; 
  icon: string;
  onPress?: () => void;
  style?: any;
}) {
  return (
    <ModernCard onPress={onPress} style={[{ flex: 1, margin: SPACING.sm }, style]}>
      <View style={{ alignItems: 'center', padding: SPACING.lg }}>
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.md,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <Text style={{ fontSize: 32 }}>{icon}</Text>
        </View>
        <Text style={[TYPOGRAPHY.h3, { textAlign: 'center', marginBottom: 4 }]}>{title}</Text>
        <Text style={[TYPOGRAPHY.body2, { textAlign: 'center', color: COLORS.textSecondary }]}>{subtitle}</Text>
      </View>
    </ModernCard>
  );
}

export function ModernNoteCard({ 
  title, 
  content, 
  onPress,
  style,
  pinned = false
}: { 
  title: string; 
  content: string; 
  onPress?: () => void;
  style?: any;
  pinned?: boolean;
}) {
  return (
    <ModernCard onPress={onPress} style={[{ marginBottom: SPACING.md }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
        <Text style={[TYPOGRAPHY.h3, { flex: 1, marginRight: SPACING.sm }]} numberOfLines={1}>{title}</Text>
        {pinned && (
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 12 }}>📌</Text>
          </View>
        )}
      </View>
      <Text style={[TYPOGRAPHY.body1, { color: COLORS.textSecondary }]} numberOfLines={3}>{content}</Text>
    </ModernCard>
  );
}

export function ModernChatCard({ 
  name, 
  message, 
  time,
  unread = false,
  onPress,
  style
}: { 
  name: string; 
  message: string; 
  time: string;
  unread?: boolean;
  onPress?: () => void;
  style?: any;
}) {
  return (
    <ModernCard onPress={onPress} style={[{ marginBottom: SPACING.sm }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ModernAvatar size={48} style={{ marginRight: SPACING.md }} />
        <View style={{ flex: 1, marginRight: SPACING.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={TYPOGRAPHY.h3}>{name}</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textTertiary }]}>{time}</Text>
          </View>
          <Text style={[TYPOGRAPHY.body1, { 
            color: unread ? COLORS.text : COLORS.textSecondary,
            fontWeight: unread ? '600' : '400',
          }]} numberOfLines={1}>{message}</Text>
        </View>
        {unread && (
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.primary,
          }} />
        )}
      </View>
    </ModernCard>
  );
}

export function ModernProfileCard({ 
  name, 
  email,
  stats,
  onEdit,
  style
}: { 
  name: string; 
  email: string;
  stats?: { label: string; value: string | number }[];
  onEdit?: () => void;
  style?: any;
}) {
  return (
    <ModernCard style={[{ marginBottom: SPACING.xl }, style]}>
      <View style={{ alignItems: 'center', paddingBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: SPACING.lg }}>
        <ModernAvatar size={80} style={{ marginBottom: SPACING.md }} />
        <Text style={TYPOGRAPHY.h2}>{name}</Text>
        <Text style={[TYPOGRAPHY.body1, { color: COLORS.textSecondary, marginTop: 4 }]}>{email}</Text>
        {onEdit && (
          <ModernButton 
            variant="secondary" 
            onPress={onEdit}
            style={{ marginTop: SPACING.md, paddingHorizontal: SPACING.lg }}
          >
            Edit Profile
          </ModernButton>
        )}
      </View>
      {stats && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {stats.map((stat, index) => (
            <View key={index} style={{ alignItems: 'center' }}>
              <Text style={TYPOGRAPHY.h3}>{stat.value}</Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}
    </ModernCard>
  );
}

export function ModernSearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Search...",
  style
}: { 
  value: string; 
  onChangeText: (text: string) => void; 
  placeholder?: string;
  style?: any;
}) {
  return (
    <View style={[INPUT_STYLES.textInput, { 
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
    }, style]}>
      <Text style={{ fontSize: 20, marginRight: SPACING.sm, color: COLORS.textSecondary }}>🔍</Text>
      <Text style={{ flex: 1, color: COLORS.textSecondary }}>{placeholder}</Text>
    </View>
  );
}

export function ModernTabBar({ 
  activeTab, 
  onTabPress,
  tabs
}: { 
  activeTab: string; 
  onTabPress: (tab: string) => void;
  tabs: { key: string; label: string; icon: string }[];
}) {
  return (
    <View style={NAV_STYLES.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[NAV_STYLES.tab, isActive && NAV_STYLES.activeTab]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text style={{ fontSize: 24 }}>{tab.icon}</Text>
            <Text style={[TYPOGRAPHY.caption, { 
              marginTop: 2,
              color: isActive ? COLORS.primary : COLORS.textSecondary,
            }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ModernSectionHeader({ 
  title, 
  subtitle,
  action,
  style
}: { 
  title: string; 
  subtitle?: string;
  action?: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ 
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: SPACING.xl,
    }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={TYPOGRAPHY.h2}>{title}</Text>
        {subtitle && (
          <Text style={[TYPOGRAPHY.body1, { color: COLORS.textSecondary, marginTop: 4 }]}>{subtitle}</Text>
        )}
      </View>
      {action && (
        <View style={{ marginLeft: SPACING.md }}>
          {action}
        </View>
      )}
    </View>
  );
}

export function ModernLoadingSpinner({ 
  size = 40,
  color = COLORS.primary,
  style
}: { 
  size?: number;
  color?: string;
  style?: any;
}) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={{
        width: '100%',
        height: '100%',
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color + '30',
        borderTopColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

export function ModernEmptyState({ 
  icon, 
  title, 
  subtitle,
  action,
  style
}: { 
  icon: string; 
  title: string; 
  subtitle: string;
  action?: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[{ alignItems: 'center', padding: SPACING.xxl }, style]}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        <Text style={{ fontSize: 40 }}>{icon}</Text>
      </View>
      <Text style={TYPOGRAPHY.h3}>{title}</Text>
      <Text style={[TYPOGRAPHY.body1, { 
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.xl,
      }]}>{subtitle}</Text>
      {action}
    </View>
  );
}

export function ModernProgressBar({ 
  progress, 
  height = 8,
  backgroundColor = COLORS.surface,
  progressColor = COLORS.primary,
  style
}: { 
  progress: number; 
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: any;
}) {
  return (
    <View style={[{
      width: '100%',
      height,
      backgroundColor,
      borderRadius: height / 2,
      overflow: 'hidden',
    }, style]}>
      <View style={{
        height: '100%',
        width: `${Math.min(Math.max(progress, 0), 100)}%`,
        backgroundColor: progressColor,
        borderRadius: height / 2,
        shadowColor: progressColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }} />
    </View>
  );
}

export function ModernBadge({ 
  text, 
  variant = 'primary',
  size = 'medium',
  style
}: { 
  text: string; 
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}) {
  const variantColors = {
    primary: { bg: COLORS.primary + '20', text: COLORS.primary },
    secondary: { bg: COLORS.surfaceLight, text: COLORS.textSecondary },
    success: { bg: COLORS.success + '20', text: COLORS.success },
    warning: { bg: COLORS.warning + '20', text: COLORS.warning },
    error: { bg: COLORS.error + '20', text: COLORS.error },
  };

  const sizeStyles = {
    small: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 10 },
    medium: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 12 },
    large: { paddingVertical: 6, paddingHorizontal: 16, fontSize: 14 },
  };

  const color = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View style={[{
      backgroundColor: color.bg,
      borderRadius: RADIUS.full,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
    }, style]}>
      <Text style={[{
        color: color.text,
        fontWeight: '600',
        fontSize: sizeStyle.fontSize,
      }]}>{text}</Text>
    </View>
  );
}

export function ModernDivider({ 
  style
}: { 
  style?: any;
}) {
  return (
    <View style={[{
      height: 1,
      backgroundColor: COLORS.border,
      marginVertical: SPACING.lg,
    }, style]} />
  );
}

export function ModernTooltip({ 
  text, 
  visible,
  style
}: { 
  text: string; 
  visible: boolean;
  style?: any;
}) {
  if (!visible) return null;

  return (
    <View style={[{
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.sm,
      padding: SPACING.sm,
      position: 'absolute',
      top: -40,
      left: '50%',
      transform: [{ translateX: -50 }],
      zIndex: 1000,
      borderWidth: 1,
      borderColor: COLORS.border,
      ...SHADOWS.small,
    }, style]}>
      <Text style={[TYPOGRAPHY.caption, { color: COLORS.text }]}>{text}</Text>
    </View>
  );
}

export function ModernRipple({ 
  onPress,
  style
}: { 
  onPress?: () => void;
  style?: any;
}) {
  return (
    <Pressable style={style} onPress={onPress}>
      {({ pressed }) => (
        <View style={[style, pressed && {
          opacity: 0.7,
          transform: [{ scale: 0.98 }],
        }]} />
      )}
    </Pressable>
  );
}

export default {
  ModernBottomNav,
  ModernCard,
  ModernButton,
  ModernInput,
  ModernSection,
  ModernAvatar,
  ModernStatCard,
  ModernQuickActionCard,
  ModernNoteCard,
  ModernChatCard,
  ModernProfileCard,
  ModernSearchBar,
  ModernTabBar,
  ModernSectionHeader,
  ModernLoadingSpinner,
  ModernEmptyState,
  ModernProgressBar,
  ModernBadge,
  ModernDivider,
  ModernTooltip,
  ModernRipple,
};
