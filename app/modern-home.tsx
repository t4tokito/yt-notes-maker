import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ModernUI } from '../components/ModernUI';
import { COLORS, TYPOGRAPHY, SPACING } from '../lib/designSystem';

export default function ModernHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  const stats = [
    { title: 'Notes', value: 24, icon: '📝', color: COLORS.primary },
    { title: 'Friends', value: 8, icon: '👥', color: COLORS.success },
    { title: 'Groups', value: 3, icon: '🏠', color: COLORS.warning },
    { title: 'Quizzes', value: 12, icon: '📊', color: COLORS.error },
  ];

  const recentNotes = [
    { id: '1', title: 'React Native Basics', content: 'Introduction to React Native components...', pinned: true },
    { id: '2', title: 'Firebase Integration', content: 'Setting up Firebase authentication...', pinned: false },
    { id: '3', title: 'Expo Router', content: 'Navigation patterns in Expo...', pinned: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={{ marginBottom: SPACING.xxl }}>
          <Text style={[TYPOGRAPHY.h1, { marginBottom: SPACING.sm }]}>
            Welcome back, Alex! 👋
          </Text>
          <Text style={[TYPOGRAPHY.body1, { color: colors.textSecondary }]}>
            Ready to boost your productivity today?
          </Text>
        </View>

        {/* Quick Stats */}
        <ModernUI.ModernSection title="Your Stats" subtitle="Track your learning progress">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm }}>
            {stats.map((stat, index) => (
              <View key={index} style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
                <ModernUI.ModernStatCard {...stat} />
              </View>
            ))}
          </View>
        </ModernUI.ModernSection>

        {/* Recent Notes */}
        <ModernUI.ModernSection title="Recent Notes" subtitle="Your latest study materials">
          {recentNotes.map((note) => (
            <ModernUI.ModernNoteCard
              key={note.id}
              title={note.title}
              content={note.content}
              pinned={note.pinned}
              onPress={() => router.push(`/note/${note.id}`)}
            />
          ))}
        </ModernUI.ModernSection>

        {/* Quick Actions */}
        <ModernUI.ModernSection title="Quick Actions" subtitle="Start creating content">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm }}>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Generate Notes"
                subtitle="Create AI-powered notes from YouTube videos"
                icon="🎥"
                onPress={() => router.push('/create')}
              />
            </View>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Create Quiz"
                subtitle="Generate quizzes from your notes or videos"
                icon="📝"
                onPress={() => router.push('/create')}
              />
            </View>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Upload PDF"
                subtitle="Extract content and generate quizzes"
                icon="📄"
                onPress={() => router.push('/create')}
              />
            </View>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Study Assistant"
                subtitle="Chat with AI about your notes"
                icon="🤖"
                onPress={() => router.push('/chat')}
              />
            </View>
          </View>
        </ModernUI.ModernSection>
      </ScrollView>

      <ModernUI.ModernBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
