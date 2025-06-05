import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Text,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { sendToAI } from '../services/chatIA';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';
import Markdown from 'react-native-markdown-display';

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user, authToken } = useAuth();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const onSend = async () => {
    if (!input.trim() || !user || !authToken) return;

    const userMsg = {
      id: Date.now().toString(),
      text: input.trim(),
      fromUser: true,
    };

    setMessages((prev) => [userMsg, ...prev]);
    setInput('');
    setIsTyping(true);
    setLoading(true);

    try {
      const response = await sendToAI(userMsg.text, user.uuid, authToken);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: response,
        fromUser: false,
      };
      setMessages((prev) => [botMsg, ...prev]);
    } catch (e) {
      setMessages((prev) => [
        { id: (Date.now() + 2).toString(), text: 'Error getting response', fromUser: false },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={require('../assets/icons/classy-logo.png')} style={{ width: 40, height: 40, marginRight: 8 }} />
            <Text style={[styles.headerText, { color: theme.text }]}>Classy</Text>
          </View>
          <Text style={[styles.description, { color: theme.text }]}>
            Your AI assistant to answer questions about using the ClassConnect app.
          </Text>
          <View style={styles.poweredRow}>
            <Text style={{ color: theme.text, marginRight: 4 }}>powered by</Text>
            <Image source={require('../assets/icons/gemini-logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          contentContainerStyle={{ padding: spacing.md }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                {
                  alignSelf: item.fromUser ? 'flex-end' : 'flex-start',
                  flexDirection: item.fromUser ? 'row-reverse' : 'row',
                },
              ]}
            >
              {/* Avatar IA o Usuario */}
              {!item.fromUser ? (
                <Image source={require('../assets/icons/classy-logo.png')} style={styles.avatar} />
              ) : (
                user?.urlProfilePhoto && (
                  <Image source={{ uri: user.urlProfilePhoto }} style={[styles.avatar, { borderRadius: 12 }]} />
                )
              )}

              {/* Mensaje */}
              <View
                style={{
                  backgroundColor: item.fromUser ? theme.primary : theme.surface,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                  maxWidth: '85%',
                }}
              >
                <Markdown style={markdownStyles}>{item.text}</Markdown>
              </View>
            </View>
          )}
          ListHeaderComponent={
            isTyping ? (
              <View style={styles.messageRow}>
                <Image source={require('../assets/icons/classy-logo.png')} style={styles.avatar} />
                <View style={{ backgroundColor: theme.surface, padding: spacing.sm, borderRadius: 16 }}>
                  <Text style={{ color: theme.text }}>Classy is typing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask something..."
            placeholderTextColor={theme.border}
            editable={!loading}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={loading}
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: fonts.size.xl,
    fontFamily: fonts.family.regular,
    fontWeight: fonts.weight.bold as '700',
  },
  description: {
    marginTop: spacing.sm,
    fontSize: fonts.size.sm,
    textAlign: 'center',
  },
  poweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
  },
  avatar: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  sendButton: {
    marginLeft: spacing.sm,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
});

const markdownStyles = {
  body: {
    color: 'white',
    fontSize: 15,
    flexWrap: 'wrap' as const,
    margin: 0,
    padding: 0,
    lineHeight: 20,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
};
