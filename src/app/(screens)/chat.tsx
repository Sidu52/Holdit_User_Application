import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { THEME } from "@/theme/theme";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai" | "agent";
  timestamp: Date;
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Holdit AI Assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<"ai" | "agent">("ai");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    if (mode === "ai") {
      simulateAIResponse(userMessage.text);
    }
  }, [inputText, mode]);

  const simulateAIResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let responseText = "I'm processing your request. One moment please...";
      
      const lowerText = userText.toLowerCase();
      if (lowerText.includes("booking") || lowerText.includes("order")) {
        responseText = "You can view all your active bookings in the 'My Luggage' section of your profile.";
      } else if (lowerText.includes("price") || lowerText.includes("cost")) {
        responseText = "Our pricing starts at ₹99/day depending on the bag size. You can see exact rates in the Schedule tab.";
      } else if (lowerText.includes("agent") || lowerText.includes("human")) {
        responseText = "Connecting you to a live representative now. Please wait...";
        setMode("agent");
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const switchToAgent = () => {
    setMode("agent");
    const sysMessage: Message = {
      id: Date.now().toString(),
      text: "Switching to Live Agent... An agent will be with you shortly.",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, sysMessage]);
    
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Hi, I'm Rahul from Holdit Support. I've joined the chat to help you. What's on your mind?",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    }, 2000);
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.otherMessage,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarMini}>
            <Ionicons 
              name={item.sender === "ai" ? "sparkles" : "person"} 
              size={12} 
              color="#FFF" 
            />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.otherBubble
        ]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.otherText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.userTime : styles.otherTime]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {mode === "ai" ? "Holdit AI Assistant" : "Live Support"}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        {mode === "ai" && (
          <TouchableOpacity onPress={switchToAgent} style={styles.agentButton}>
            <Text style={styles.agentButtonText}>Talk to Agent</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={THEME.PRIMARY} />
              <Text style={styles.typingText}>Holdit AI is typing...</Text>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
  },
  agentButton: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  agentButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: THEME.PRIMARY,
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#FFF",
  },
  otherText: {
    color: "#1E293B",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
  },
  otherTime: {
    color: "#94A3B8",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 40,
    marginTop: -8,
  },
  typingText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
});
