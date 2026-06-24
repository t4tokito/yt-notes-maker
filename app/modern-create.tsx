import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ModernUI } from '../components/ModernUI';
import { COLORS, TYPOGRAPHY, SPACING } from '../lib/designSystem';

export default function ModernCreateScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create');

  const createOptions = [
    {
      title: 'Generate Notes',
      subtitle: 'Create AI-powered notes from YouTube videos',
      icon: '🎥',
      route: '/new',
    },
    {
      title: 'Create Quiz',
      subtitle: 'Generate quizzes from your notes or videos',
      icon: '📝',
      route: '/create-quiz',
    },
    {
      title: 'Upload PDF',
      subtitle: 'Extract content and generate quizzes from PDFs',
      icon: '📄',
      route: '/upload-pdf',
    },
    {
      title: 'Study Assistant',
      subtitle: 'Chat with AI about your notes and learning',
      icon: '🤖',
      route: '/chat',
    },
    {
      title: 'Group Study',
      subtitle: 'Create study groups and collaborate',
      icon: '👥',
      route: '/create-group',
    },
    {
      title: 'AI Analysis',
      subtitle: 'Deep analysis of your study materials',
      icon: '🔍',
      route: '/analysis',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING.xxl }}>
          <Text style={[TYPOGRAPHY.h1, { marginBottom: SPACING.sm }]}>
            Create Something Great ✨
          </Text>
          <Text style={[TYPOGRAPHY.body1, { color: colors.textSecondary }]}>
            Choose from our AI-powered tools to boost your productivity
          </Text>
        </View>

        {/* Create Options Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm, marginBottom: SPACING.xl }}>
          {createOptions.map((option, index) => (
            <View key={index} style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.lg }}>
              <ModernUI.ModernQuickActionCard
                title={option.title}
                subtitle={option.subtitle}
                icon={option.icon}
                onPress={() => router.push(option.route)}
              />
            </View>
          ))}
        </View>

        {/* AI Tools Section */}
        <ModernUI.ModernSection title="AI Tools" subtitle="Leverage artificial intelligence for better results">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm }}>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Smart Summaries"
                subtitle="Generate concise summaries of long content"
                icon="📋"
                onPress={() => router.push('/new')}
              />
            </View>
            <View style={{ width: '50%', paddingHorizontal: SPACING.sm, marginBottom: SPACING.md }}>
              <ModernUI.ModernQuickActionCard
                title="Quiz Generator"
                subtitle="Create custom quizzes from any text"
                icon="🎯"
                onPress={() => router.push('/create-quiz')}
              />
            </View>
          </View>
        </ModernUI.ModernSection>
      </ScrollView>

      <ModernUI.ModernBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
