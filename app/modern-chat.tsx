import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, TextInput, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ModernUI } from '../components/ModernUI';
import { COLORS, TYPOGRAPHY, SPACING } from '../lib/designSystem';

export default function ModernChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');

  const conversations = [
    { id: '1', name: 'Study Group Alpha', lastMessage: 'Can we meet tomorrow at 3 PM?', time: '10:30 AM', unread: true },
    { id: '2', name: 'React Native Help', lastMessage: 'The useEffect hook is very useful...', time: 'Yesterday', unread: false },
    { id: '3', name: 'AI Assistant', lastMessage: 'I can help you generate notes from YouTube...', time: '2 days ago', unread: false },
    { id: '4', name: 'Quiz Master', lastMessage: 'Your quiz has been generated successfully!', time: '3 days ago', unread: true },
  ];

  const messages = [
    { id: '1', text: 'Hello! Can you help me with React Native navigation?', from: 'me', time: '10:00 AM' },
    { id: '2', text: 'Of course! I can help you with Expo Router and navigation patterns.', from: 'ai', time: '10:01 AM' },
    { id: '3', text: 'What are the best practices for stack navigation?', from: 'me', time: '10:02 AM' },
    { id: '4', text: 'Stack navigation is great for maintaining navigation history. Use the Stack.Screen component for each screen.', from: 'ai', time: '10:03 AM' },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Add message logic here
      setMessage('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={[TYPOGRAPHY.h1, { marginBottom: SPACING.sm }]}>
            Study Assistant 🤖
          </Text>
          <Text style={[TYPOGRAPHY.body1, { color: colors.textSecondary }]}>
            Your AI-powered learning companion
          </Text>
        </View>

        {/* Conversations */}
        <ModernUI.ModernSection title="Recent Conversations" subtitle="Continue your study discussions">
          {conversations.map((conv) => (
            <ModernUI.ModernChatCard
              key={conv.id}
              name={conv.name}
              message={conv.lastMessage}
              time={conv.time}
              unread={conv.unread}
              onPress={() => router.push(`/chat/${conv.id}`)}
            />
          ))}
        </ModernUI.ModernSection>

        {/* AI Chat Interface */}
        <ModernUI.ModernSection title="AI Assistant" subtitle="Ask questions about your notes or learning">
          <ModernUI.ModernCard style={{ padding: SPACING.lg, marginBottom: SPACING.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md }}>
              <View style={{ marginRight: SPACING.md }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.body1, { fontWeight: '600', marginBottom: 4 }]}>
                  Study Assistant
                </Text>
                <Text style={[TYPOGRAPHY.body1, { color: colors.textSecondary }]}>
                  Hello! I'm here to help you with your studies. How can I assist you today?
                </Text>
              </View>
            </View>
          </ModernUI.ModernCard>

          {/* User Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.from === 'me' ? 'flex-end' : 'flex-start',
                marginBottom: SPACING.md,
                maxWidth: '80%',
              }}
            >
              <View
                style={{
                  backgroundColor: msg.from === 'me' ? COLORS.primary : colors.card,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.from === 'me' ? 4 : 16,
                  borderBottomLeftRadius: msg.from === 'me' ? 16 : 4,
                  padding: SPACING.md,
                }}
              >
                <Text style={[TYPOGRAPHY.body1, { 
                  color: msg.from === 'me' ? COLORS.text : colors.text,
                }]}>
                  {msg.text}
                </Text>
                <Text style={[TYPOGRAPHY.caption, {
                  color: msg.from === 'me' ? COLORS.text : colors.textSecondary,
                  marginTop: 4,
                  textAlign: 'right',
                }]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ModernUI.ModernSection>
      </ScrollView>

      {/* Message Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: SPACING.lg,
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: SPACING.xxl,
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask anything about your studies..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 20,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            fontSize: 16,
            color: colors.text,
            maxHeight: 100,
            marginRight: SPACING.sm,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!message.trim()}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: message.trim() ? COLORS.primary : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: COLORS.text }}>↑</Text>
        </Pressable>
      </View>

      <ModernUI.ModernBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
