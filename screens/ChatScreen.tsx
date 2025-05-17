import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { sendToAI } from '../services/chatIA.ts';

import { dbRealtime } from '../firebase/config';
import { ref, push, serverTimestamp, onValue, off,set} from 'firebase/database';

type Message = {
  id: string;
  text: string;
  fromUser: boolean;
  feedback?: Feedback;
};

type Feedback = {
  rating: number;
  comment?: string | null;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, authToken } = useAuth();
  const [feedbackSelected, setFeedbackSelected] = useState<Record<string, number>>({});
  const [feedbackComments, setFeedbackComments] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const saveMessageToRealtimeDB = async (message: Message, userId: string) => {
    try {
      const messagesRef = ref(dbRealtime, `chats/${userId}/messages`);
      await push(messagesRef, {
        text: message.text,
        fromUser: message.fromUser,
        createdAt: serverTimestamp(),
        feedback: message.feedback
          ? {
              rating: message.feedback.rating,
              comment: message.feedback.comment ?? null,
            }
          : null,
      });
    } catch (error) {
      console.error('Error saving message to Realtime DB:', error);
    }
  };

  const logUnknownInteraction = async (input: string, userId: string) => {
    try {
      const unknownRef = ref(dbRealtime, `unknown`);
      await push(unknownRef, {
        question: input,
        createdAt: serverTimestamp(),
        userId: userId,
      });
    } catch (error) {
      console.error('Error logging unknown input:', error);
    }
  };

useEffect(() => {
  if (!user) return;

  const messagesRef = ref(dbRealtime, `chats/${user.uuid}/messages`);
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const loadedMessages: Message[] = Object.entries(data)
        .map(([key, value]: any) => ({
          id: key,
          text: value.text,
          fromUser: value.fromUser,
          feedback: value.feedback
            ? {
                rating: value.feedback.rating,
                comment: value.feedback.comment_feedback ?? value.feedback.comment ?? null,
              }
            : undefined,
        }))
        .sort((a, b) => (a.id < b.id ? 1 : -1));

      setMessages(loadedMessages);
    } else {
      setMessages([]);
    }
  });

  return () => off(messagesRef, 'value', unsubscribe);
}, [user]);

  const onSend = async () => {
    if (!input.trim() || !user || !authToken) return;

    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      fromUser: true,
    };
    setInput('');
    setMessages((prev) => [userMsg, ...prev]);
    await saveMessageToRealtimeDB(userMsg, user.uuid);

    try {
      const response = await sendToAI(input.trim(), authToken);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        fromUser: false,
      };
      setMessages((prev) => [botMsg, ...prev]);
      await saveMessageToRealtimeDB(botMsg, user.uuid);

      if (
        response.toLowerCase().includes('no entiendo') ||
        response.toLowerCase().includes('no puedo ayudarte')
      ) {
        await logUnknownInteraction(input.trim(), user.uuid);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Error obtaining answer',
        fromUser: false,
      };
      setMessages((prev) => [errorMsg, ...prev]);
      await saveMessageToRealtimeDB(errorMsg, user.uuid);
      await logUnknownInteraction(input.trim(), user.uuid);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

    const saveFeedbackToRealtimeDB = async (
    userId: string,
    messageId: string,
    rating: number,
    comment_feedback?: string,
    comment?: string
    ) => {
    try {
        const feedbackRef = ref(dbRealtime, `feedback/${messageId}`);
        await set(feedbackRef, {
        rating,
        comment_feedback: comment_feedback ?? null,
        createdAt: serverTimestamp(),
        userId:userId,
        comment: comment,
        });
    } catch (error) {
        console.error('Error saving feedback to Realtime DB:', error);
    }
    };

    useEffect(() => {
    if (!user) return;

    const feedbackRef = ref(dbRealtime, `feedback/${user.uuid}`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
        const initialFeedback: Record<string, number> = {};
        Object.entries(data).forEach(([messageId, value]: any) => {
            if (value?.rating) {
            initialFeedback[messageId] = value.rating;
            }
        });
        setFeedbackSelected(initialFeedback);
        }
    });

    return () => off(feedbackRef, 'value', unsubscribe);
    }, [user]);

    const handleFeedback = async (
    messageId: string,
    rating: number,
    comment_feedback?: string,
    comment?: string
    ) => {
    if (!user) return;

    setFeedbackSelected((prev) => ({ ...prev, [messageId]: rating }));

    await saveFeedbackToRealtimeDB(user.uuid, messageId, rating,comment_feedback, comment);
    };

    useEffect(() => {
    if (editingCommentId !== null) return;

    const messageToEdit = messages.find(
        (msg) =>
        feedbackSelected[msg.id] !== undefined && 
        (!feedbackComments[msg.id] || feedbackComments[msg.id].trim() === '') 
    );

    if (messageToEdit) {
        setEditingCommentId(messageToEdit.id);
    }
    }, [messages, feedbackSelected, feedbackComments, editingCommentId]);



  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
        const isFeedbackSelected = feedbackSelected[item.id];
        const isEditing = editingCommentId === item.id;

        return (
            <View
            style={[
                styles.message,
                item.fromUser ? styles.userMessage : styles.botMessage,
            ]}
            >
            <Text
                style={[
                styles.messageText,
                { color: item.fromUser ? 'white' : 'black' },
                ]}
            >
                {item.text}
            </Text>

            {!item.fromUser && (
                <View style={styles.feedbackContainer}>
                <TouchableOpacity
                    style={[
                    styles.ratingButton,
                    feedbackSelected[item.id] === 5 && styles.ratingButtonSelected,
                    ]}
                    onPress={() =>
                    handleFeedback(
                        item.id,
                        5,
                        feedbackComments[item.id],
                        item.text
                    )
                    }
                >
                    <Text style={styles.feedbackText}>👍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                    styles.ratingButton,
                    feedbackSelected[item.id] === 1 && styles.ratingButtonSelected,
                    ]}
                    onPress={() =>
                    handleFeedback(
                        item.id,
                        1,
                        feedbackComments[item.id],
                        item.text
                    )
                    }
                >
                    <Text style={styles.feedbackText}>👎</Text>
                </TouchableOpacity>
                </View>
                
            )}

            {isFeedbackSelected && !item.feedback && (
                <View style={styles.commentContainer}>
                {editingCommentId === item.id ? (
                <>
                    <TextInput
                    placeholder="Leave a comment (optional)"
                    value={feedbackComments[item.id] || ''}
                    onChangeText={(text) =>
                        setFeedbackComments((prev) => ({
                        ...prev,
                        [item.id]: text,
                        }))
                    }
                    style={styles.commentInput}
                    />
                    <TouchableOpacity
                    style={styles.submitCommentButton}
                    onPress={() => {
                        handleFeedback(
                        item.id,
                        feedbackSelected[item.id],
                        feedbackComments[item.id],
                        item.text
                        );
                        setEditingCommentId(null);
                    }}
                    >
                    <Text style={{ color: 'white' }}>Save</Text>
                    </TouchableOpacity>
                </>
                ) : (
                <>
                    <Text style={{ flex: 1, color: '#333' }}>
                    {feedbackComments[item.id]}
                    </Text>
                    <TouchableOpacity
                    style={[styles.submitCommentButton, { backgroundColor: '#aaa' }]}
                    onPress={() => setEditingCommentId(item.id)}
                    >
                    <Text style={{ color: 'white' }}>Editar</Text>
                    </TouchableOpacity>
                </>
                )}

                </View>
            )}
            </View>
        );
        }}

          contentContainerStyle={{ paddingVertical: 10 }}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything"
            style={styles.input}
            editable={!loading}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={loading}
            style={styles.sendButton}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {loading ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  message: {
    maxWidth: '75%',
    marginVertical: 4,
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#0084ff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {},
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#0084ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  feedbackContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  ratingButton: {
    marginLeft: 10,
  },
  feedbackText: {
    fontSize: 16,
  },
  feedbackReceived: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
    ratingButtonSelected: {
    backgroundColor: '#0084ff',
    borderRadius: 12,
    padding: 4,
    },
commentContainer: {
  marginTop: 6,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
commentInput: {
  flex: 1,
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 12,
  padding: 6,
  backgroundColor: '#fff',
},
submitCommentButton: {
  backgroundColor: '#0084ff',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 12,
},

});
