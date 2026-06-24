import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ModernUI } from '../components/ModernUI';
import { COLORS, TYPOGRAPHY, SPACING } from '../lib/designSystem';

export default function ModernProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const userStats = [
    { label: 'Notes Created', value: 24 },
    { label: 'Quizzes Generated', value: 12 },
    { label: 'Study Hours', value: 48 },
    { label: 'Streak', value: 7 },
  ];

  const menuItems = [
    { icon: '👤', title: 'Edit Profile', subtitle: 'Update your personal information' },
    { icon: '🔔', title: 'Notifications', subtitle: 'Manage your notification preferences' },
    { icon: '🔒', title: 'Privacy', subtitle: 'Control your data and privacy settings' },
    { icon: '💳', title: 'Subscription', subtitle: 'Manage your premium plan' },
    { icon: '🎯', title: 'Achievements', subtitle: 'View your learning achievements' },
    { icon: '📊', title: 'Analytics', subtitle: 'View your study statistics' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ModernUI.ModernProfileCard
          name="Alex Johnson"
          email="alex@example.com"
          stats={userStats}
          onEdit={() => router.push('/edit-profile')}
          style={{ marginBottom: SPACING.xl }}
        />

        {/* Quick Actions */}
        <ModernUI.ModernSection title="Quick Actions" subtitle="Common tasks and shortcuts">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm, marginBottom: SPACING.xl }}>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Generate Notes"
                subtitle="Create new notes from YouTube"
                icon="🎥"
                onPress={() => router.push('/new')}
              />
            </View>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Create Quiz"
                subtitle="Generate a new quiz"
                icon="📝"
                onPress={() => router.push('/create-quiz')}
              />
            </View>
          </View>
        </ModernUI.ModernSection>

        {/* Settings */}
        <ModernUI.ModernSection title="Settings" subtitle="Customize your app experience">
          <ModernUI.ModernCard style={{ marginBottom: SPACING.md }}>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: SPACING.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.accentLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.md,
                }}>
                  <Text style={{ fontSize: 20 }}>🔔</Text>
                </View>
                <View>
                  <Text style={[TYPOGRAPHY.body1, { fontWeight: '600' }]}>
                    Notifications
                  </Text>
                  <Text style={[TYPOGRAPHY.body2, { color: colors.textSecondary }]}>
                    Receive study reminders and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={notificationsEnabled ? '#fff' : colors.card}
              />
            </Pressable>
          </ModernUI.ModernCard>
        </ModernUI.ModernSection>

        {/* Menu Items */}
        <ModernUI.ModernSection title="More Options" subtitle="Additional settings and features">
          {menuItems.map((item, index) => (
            <ModernUI.ModernCard
              key={index}
              onPress={() => {
                console.log(`Pressed: ${item.title}`);
              }}
              style={{ marginBottom: SPACING.sm }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.md,
                }}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.body1, { fontWeight: '600', marginBottom: 4 }]}>
                    {item.title}
                  </Text>
                  <Text style={[TYPOGRAPHY.body2, { color: colors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>→</Text>
              </View>
            </ModernUI.ModernCard>
          ))}
        </ModernUI.ModernSection>

        {/* Logout Button */}
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: SPACING.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.errorBorder,
            marginTop: SPACING.lg,
          }}
          onPress={() => {
            console.log('Logging out...');
          }}
        >
          <Text style={[TYPOGRAPHY.body1, { color: colors.errorText, fontWeight: '600' }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>

      <ModernUI.ModernBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
