
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {sendToAI} from '../services/chatIA.ts';
type Message = {
  id: string;
  text: string;
  fromUser: boolean;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, authToken } = useAuth();
  

  const flatListRef = useRef<FlatList>(null);

  const onSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, fromUser: true };
    setMessages((prev) => [userMsg, ...prev]); 
    setInput('');
    if (!authToken || !user) return;
    try {
      const response = await sendToAI(input, authToken);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: response, fromUser: false };
      setMessages((prev) => [botMsg, ...prev]);
    } catch {
      const errorMsg: Message = { id: (Date.now() + 2).toString(), text: 'Error obtaining answer', fromUser: false };
      setMessages((prev) => [errorMsg, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages]);

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
          renderItem={({ item }) => (
            <View style={[styles.message, item.fromUser ? styles.userMessage : styles.botMessage]}>
              <Text style={[styles.messageText, { color: item.fromUser ? 'white' : 'black' }]}>{item.text}</Text>
            </View>
          )}
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
          />
          <TouchableOpacity onPress={onSend} disabled={loading} style={styles.sendButton}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? '...' : 'Send'}</Text>
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
  messageText: {
  },
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
});
