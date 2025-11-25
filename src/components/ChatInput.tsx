import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, rf, rs } from '../theme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  value, 
  onChangeText, 
  onSend, 
  onAttach, 
  isLoading = false,
  placeholder = "Ask about wine..."
}: ChatInputProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.attachButton}
        onPress={onAttach}
        disabled={isLoading}
      >
        <Ionicons name="images-outline" size={24} color="#1c1915" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a39883"
        multiline
        maxLength={500}
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!value.trim() || isLoading) && styles.sendButtonDisabled
        ]}
        onPress={onSend}
        disabled={!value.trim() || isLoading}
      >
        <Text style={{ fontSize: rf(20), color: '#1c1915' }}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rs(24),
    paddingTop: rs(16),
    paddingBottom: Platform.OS === 'ios' ? rs(32) : rs(16),
    backgroundColor: '#faf8f4',
    borderTopWidth: 1,
    borderTopColor: '#e8e3d8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  attachButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    backgroundColor: '#fefdfb',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderRadius: rs(24),
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
    fontSize: rf(16),
    color: '#1c1915',
    maxHeight: rs(100),
  },
  sendButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: '#d4af37', // Fallback for gradient
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)' as any,
    }),
  },
  sendButtonDisabled: {
    backgroundColor: '#e8e3d8',
    opacity: 0.7,
  },
});

