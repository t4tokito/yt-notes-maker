import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ModernUI } from '../components/ModernUI';
import { COLORS, TYPOGRAPHY, SPACING } from '../lib/designSystem';

export default function ModernNotesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notes');
  const [searchQuery, setSearchQuery] = useState('');

  const notes = [
    { id: '1', title: 'React Native Basics', content: 'Introduction to React Native components and architecture...', category: 'Programming', createdAt: '2 hours ago', pinned: true },
    { id: '2', title: 'Firebase Integration', content: 'Setting up Firebase authentication and database...', category: 'Backend', createdAt: '1 day ago', pinned: false },
    { id: '3', title: 'Expo Router', content: 'Navigation patterns and deep linking in Expo...', category: 'Mobile', createdAt: '2 days ago', pinned: false },
    { id: '4', title: 'TypeScript Tips', content: 'Advanced TypeScript patterns for React Native...', category: 'Programming', createdAt: '3 days ago', pinned: false },
    { id: '5', title: 'UI Design Principles', content: 'Modern design patterns for mobile apps...', category: 'Design', createdAt: '1 week ago', pinned: true },
  ];

  const categories = ['All', 'Programming', 'Backend', 'Mobile', 'Design'];

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const regularNotes = filteredNotes.filter(note => !note.pinned);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <ModernUI.ModernSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
          style={{ marginBottom: SPACING.xl }}
        />

        {/* Categories */}
        <ModernUI.ModernSection title="Categories" subtitle="Organize your notes by topic">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm, marginBottom: SPACING.xl }}>
            {categories.map((category, index) => (
              <Pressable
                key={index}
                style={{
                  paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  marginHorizontal: SPACING.sm,
                  marginBottom: SPACING.sm,
                  backgroundColor: category === 'All' ? COLORS.primary : COLORS.surface,
                  borderRadius: 20,
                  borderWidth: category === 'All' ? 0 : 1,
                  borderColor: category === 'All' ? COLORS.primary : COLORS.border,
                }}
              >
                <Text style={{ 
                  color: category === 'All' ? COLORS.text : COLORS.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </ModernUI.ModernSection>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <ModernUI.ModernSection title="Pinned Notes" subtitle="Your most important notes">
            {pinnedNotes.map((note) => (
              <ModernUI.ModernNoteCard
                key={note.id}
                title={note.title}
                content={note.content}
                pinned={true}
                onPress={() => router.push(`/note/${note.id}`)}
              />
            ))}
          </ModernUI.ModernSection>
        )}

        {/* Regular Notes */}
        {regularNotes.length > 0 && (
          <ModernUI.ModernSection title="All Notes" subtitle="Your complete note collection">
            {regularNotes.map((note) => (
              <ModernUI.ModernNoteCard
                key={note.id}
                title={note.title}
                content={note.content}
                pinned={false}
                onPress={() => router.push(`/note/${note.id}`)}
              />
            ))}
          </ModernUI.ModernSection>
        )}
      </ScrollView>

      <ModernUI.ModernBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
