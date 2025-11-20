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
import { theme } from '../theme';

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
        <Text style={{ fontSize: 20 }}>📎</Text>
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
        <Text style={{ fontSize: 20, color: '#1c1915' }}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#faf8f4',
    borderTopWidth: 1,
    borderTopColor: '#e8e3d8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fefdfb',
    borderWidth: 1,
    borderColor: '#e8e3d8',
    borderRadius: 24,
    fontFamily: Platform.OS === 'ios' ? 'CrimsonPro_400Regular' : 'serif',
    fontSize: 18,
    color: '#1c1915',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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

