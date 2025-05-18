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
import { sendToAI ,addFeedback ,addUnknownQuestion} from '../services/chatIA.ts';

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

  const logUnknownInteraction = async (input: string, userId: string) => {
    try {
      if (!user || !authToken) return;
      addUnknownQuestion(input,userId,authToken);
    } catch (error) {
      console.error('Error logging unknown input:', error);
    }
  };

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

    try {
      const response = await sendToAI(input.trim(), authToken);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        fromUser: false,
      };
      setMessages((prev) => [botMsg, ...prev]);
      const lowerResponse = response.toLowerCase();

      const unknownResponses = [
        'no entiendo',
        'no puedo ayudarte',
        'no tengo suficiente información',
        'no sé',
        'no estoy seguro',
        'no tengo una respuesta',
        'no puedo responder',
        'no tengo datos',
        'no tengo conocimiento sobre eso',
        'no comprendo',
        'no tengo información suficiente',
        'no fue entrenado para',
        'no logro interpretar',
        'no encuentro una respuesta',
        'no puedo procesar',
        'no tengo contexto suficiente',
        'no estoy capacitado para',
        'soy una ia y no puedo',
        'soy un modelo de lenguaje',
        'como modelo de lenguaje',
        'no tengo capacidad para'
      ];

      const isUnknownResponse = unknownResponses.some(phrase => lowerResponse.includes(phrase));
      if (isUnknownResponse) {
        await logUnknownInteraction(input.trim(), user.uuid);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Error obtaining answer',
        fromUser: false,
      };
      setMessages((prev) => [errorMsg, ...prev]);
      await logUnknownInteraction(input.trim(), user.uuid);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

    const saveFeedback = async (
    userId: string,
    rating: number,
    answer: string,
    comment_feedback?: string,
    ) => {
    try {
      if (!user || !authToken) return;
      await addFeedback(answer,rating,userId,authToken,comment_feedback);
    } catch (error) {
        console.error('Error saving feedback:', error);
    }
    };

    const handleFeedback = async (
    messageId: string,
    rating: number,
    comment: string,
    comment_feedback?: string,
    ) => {
    if (!user) return;

    setFeedbackSelected((prev) => ({ ...prev, [messageId]: rating }));

    await saveFeedback(user.uuid, rating, comment,comment_feedback);
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
                        item.text,
                        feedbackComments[item.id],
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
                        item.text,
                        feedbackComments[item.id],
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
                        item.text,
                        feedbackComments[item.id],
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
