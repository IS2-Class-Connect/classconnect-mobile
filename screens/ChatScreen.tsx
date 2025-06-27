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
import { useTheme } from '../hooks/useTheme'; // No es necesario importar colors directamente
import { sendToAI, addFeedback } from '../services/chatIA';
import { spacing } from '../constants/spacing';
import { fonts } from '../constants/fonts';

import Markdown from 'react-native-markdown-display';

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [feedbackSelected, setFeedbackSelected] = useState<Record<string, number>>({});
  const [feedbackComments, setFeedbackComments] = useState<Record<string, string>>({});
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());
  const [feedbackConfirmed, setFeedbackConfirmed] = useState<Set<string>>(new Set());

  const { user, authToken } = useAuth();
  const theme = useTheme(); // Usar el hook para obtener el tema
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
        { id: (Date.now() + 2).toString(), text: 'Classy is not available', fromUser: false },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleFeedback = async (
    messageId: string,
    rating: number,
    comment: string,
    comment_feedback?: string
  ) => {
    if (!user || !authToken || feedbackSubmitted.has(messageId)) return;

    setFeedbackSelected((prev) => ({ ...prev, [messageId]: rating }));
    await addFeedback(comment, rating, user.uuid, authToken, comment_feedback);
    setFeedbackSubmitted((prev) => new Set(prev).add(messageId));
    setFeedbackConfirmed((prev) => new Set(prev).add(messageId));
    setFeedbackOpen(null);
    setTimeout(() => {
      setFeedbackConfirmed((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 4000);
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
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={require('../assets/icons/classy-logo.png')} style={{ width: 40, height: 40, marginRight: 8 }} />
            <Text style={[styles.headerText, { color: theme.text }]}>Classy</Text>
          </View>
          <Text style={[styles.description, { color: theme.text }]}>Your AI assistant to answer questions about using the ClassConnect app.</Text>
          <View style={styles.poweredRow}>
            <Text style={{ color: theme.text, marginRight: 4 }}>powered by</Text>
            <Image source={require('../assets/icons/gemini-logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          contentContainerStyle={{ padding: spacing.md }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isBot = !item.fromUser;
            const feedbackSent = feedbackSubmitted.has(item.id);
            const showFeedbackInput = feedbackOpen === item.id;

            return (
              <View
                style={[
                  styles.messageRow,
                  {
                    alignSelf: item.fromUser ? 'flex-end' : 'flex-start',
                    flexDirection: item.fromUser ? 'row-reverse' : 'row',
                  },
                ]}
              >
                {isBot ? (
                  <Image source={require('../assets/icons/classy-logo.png')} style={styles.avatar} />
                ) : (
                  user?.urlProfilePhoto && (
                    <Image source={{ uri: user.urlProfilePhoto }} style={[styles.avatar, { borderRadius: 12 }]} />
                  )
                )}

                <View style={{ maxWidth: '85%' }}>
                  <View
                    style={{
                      backgroundColor: item.fromUser ? theme.primary : theme.surface,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                    }}
                  >
                    <Markdown style={markdownStyles(theme)}>{item.text}</Markdown>
                  </View>

                  {isBot && !feedbackSent && (
                    <View>
                      <View style={styles.feedbackContainer}>
                        <TouchableOpacity
                          style={[styles.ratingButton, feedbackSelected[item.id] === 5 && { backgroundColor: theme.primary, borderRadius: 12 }]}
                          onPress={() => {
                            setFeedbackSelected((prev) => ({ ...prev, [item.id]: 5 }));
                            setFeedbackOpen(item.id);
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>👍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.ratingButton, feedbackSelected[item.id] === 1 && { backgroundColor: theme.primary, borderRadius: 12 }]}
                          onPress={() => {
                            setFeedbackSelected((prev) => ({ ...prev, [item.id]: 1 }));
                            setFeedbackOpen(item.id);
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>👎</Text>
                        </TouchableOpacity>
                      </View>
                      {showFeedbackInput && (
                        <View style={styles.commentContainer}>
                          <TextInput
                            placeholder="Leave a comment (optional)"
                            placeholderTextColor={theme.border}
                            value={feedbackComments[item.id] || ''}
                            onChangeText={(text) =>
                              setFeedbackComments((prev) => ({ ...prev, [item.id]: text }))
                            }
                            style={[styles.commentInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                          />
                          <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={() =>
                              handleFeedback(item.id, feedbackSelected[item.id], item.text, feedbackComments[item.id])
                            }
                          >
                            <Text style={{ color: 'white' }}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {feedbackConfirmed.has(item.id) && (
                    <Text style={{ marginTop: spacing.xs, marginLeft: spacing.sm, color: theme.text, fontSize: 12 }}>
                      ✅ Feedback submitted!
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
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

// Adjusted markdown styles to handle dark and light theme text color
const markdownStyles = (theme: any) => ({
  body: {
    color: theme.text,  // Use theme.text for dynamic color change
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
});


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
    alignItems: 'flex-start',
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
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
  feedbackContainer: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  ratingButton: {
    marginHorizontal: spacing.xs,
    padding: spacing.xs,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  submitButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
  },
});

