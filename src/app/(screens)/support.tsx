// ─── app/support.tsx ──────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Linking,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Layout,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { showError, showSuccess } from "@/utils/toast";
import { THEME } from "@/theme/theme";;

const { width } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type SupportCategory =
  | "booking"
  | "payment"
  | "item_issue"
  | "app_issue"
  | "account"
  | "feedback"
  | "other";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: SupportCategory;
}

interface SupportOption {
  id: string;
  category: SupportCategory;
  title: string;
  description: string;
  icon: IoniconsName;
  color: string;
}

interface ContactMethod {
  id: string;
  method: string;
  label: string;
  sublabel: string;
  icon: IoniconsName;
  color: string;
  action: string;
}

type SupportView = "main" | "faq" | "contact_form" | "ticket_submitted";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SUPPORT_OPTIONS: SupportOption[] = [
  {
    id: "opt-1",
    category: "booking",
    title: "Booking & Schedule",
    description: "Issues with scheduling, active bookings, or extensions",
    icon: "calendar-outline",
    color: THEME.PRIMARY,
  },
  {
    id: "opt-2",
    category: "payment",
    title: "Payments & Refunds",
    description: "Transaction status, refunds, or billing questions",
    icon: "card-outline",
    color: "#7c3aed",
  },
  {
    id: "opt-3",
    category: "item_issue",
    title: "Luggage Safety",
    description: "Report damaged, missing, or delayed items",
    icon: "shield-checkmark-outline",
    color: "#16a34a",
  },
  {
    id: "opt-4",
    category: "app_issue",
    title: "App & Technical",
    description: "Technical bugs, location issues, or app crashes",
    icon: "bug-outline",
    color: "#0891b2",
  },
  {
    id: "opt-5",
    category: "account",
    title: "Account & Security",
    description: "Profile updates, login issues, or data privacy",
    icon: "person-outline",
    color: "#d97706",
  },
  {
    id: "opt-6",
    category: "feedback",
    title: "Feedback",
    description: "Share your experience or suggest improvements",
    icon: "chatbubble-ellipses-outline",
    color: THEME.SECONDARY,
  },
];

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I book luggage storage?",
    answer:
      'Go to the "Schedule" tab, select your pickup location and time, choose your luggage count, and confirm. A driver will be assigned to pick up your luggage.',
    category: "booking",
  },
  {
    id: "faq-2",
    question: "Is my luggage safe with Holdit?",
    answer:
      "Yes! Your luggage is stored in our secure, 24/7 monitored facilities. Every item is tagged, photographed during pickup, and insured for your peace of mind.",
    category: "item_issue",
  },
  {
    id: "faq-3",
    question: "How can I track my booking?",
    answer:
      'You can track your booking status in real-time from the "My Luggage" section in your Profile. You\'ll see live updates from pickup to storage.',
    category: "booking",
  },
  {
    id: "faq-4",
    question: "What are the storage charges?",
    answer:
      "Pricing depends on the size and number of bags. You can see the detailed pricing breakdown in the app before confirming your schedule.",
    category: "payment",
  },
  {
    id: "faq-5",
    question: "What items are prohibited?",
    answer:
      "For safety reasons, we do not store hazardous materials, flammable items, perishable food, illegal substances, or extremely fragile/high-value jewelry.",
    category: "item_issue",
  },
  {
    id: "faq-6",
    question: "How do I request a return?",
    answer:
      'Go to your active booking details in "My Luggage" and tap "Request Return". Provide your delivery address and preferred time for drop-off.',
    category: "booking",
  },
  {
    id: "faq-7",
    question: "Can I cancel my schedule?",
    answer:
      "Yes, you can cancel your pickup schedule before a driver is assigned or arrives at your location. Check our cancellation policy in the Legal section.",
    category: "booking",
  },
  {
    id: "faq-8",
    question: "How do I update my profile?",
    answer:
      "Go to Profile > Personal Information to update your name, phone number, or email address.",
    category: "account",
  },
];

const CONTACT_METHODS: ContactMethod[] = [
  {
    id: "contact-2",
    method: "email",
    label: "Email Support",
    sublabel: "support@holdit.com",
    icon: "mail",
    color: THEME.PRIMARY,
    action: "mailto:support@holdit.com",
  },
  {
    id: "contact-3",
    method: "chat",
    label: "In-App Chat",
    sublabel: "Available 24/7",
    icon: "chatbubbles",
    color: THEME.SECONDARY,
    action: "chat",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [currentView, setCurrentView] = useState<SupportView>("main");
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(bookingId ? "booking" : null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact form state
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formBookingId, setFormBookingId] = useState(bookingId ?? "");
  const [ticketId, setTicketId] = useState("");

  // ── Filtered FAQs ─────────────────────────────────────────────────
  const filteredFAQs = useMemo(() => {
    let faqs = [...FAQ_DATA];

    if (selectedCategory) {
      faqs = faqs.filter((faq) => faq.category === selectedCategory);
    }

    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      faqs = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query),
      );
    }

    return faqs;
  }, [selectedCategory, searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleCategorySelect = useCallback((category: SupportCategory) => {
    setSelectedCategory(category);
    setCurrentView("faq");
    setExpandedFAQ(null);
    setSearchQuery("");
  }, []);

  const handleToggleFAQ = useCallback(
    (faqId: string) => {
      setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
    },
    [expandedFAQ],
  );

  const handleContactMethod = useCallback((method: ContactMethod) => {
    if (method.action === "chat") {
      router.push("/chat");
      return;
    }

    const sanitizedAction = method.action.startsWith("tel:")
      ? `tel:${method.action.replace("tel:", "").replace(/[^+0-9]/g, "")}`
      : method.action;

    Linking.canOpenURL(sanitizedAction).then((supported) => {
      if (supported) {
        Linking.openURL(sanitizedAction);
      }
    });
  }, []);

  const handleOpenContactForm = useCallback(() => {
    const categoryOption = SUPPORT_OPTIONS.find(
      (opt) => opt.category === selectedCategory,
    );
    setFormSubject(categoryOption?.title ?? "");
    setCurrentView("contact_form");
  }, [selectedCategory]);

  const handleSubmitTicket = useCallback(async () => {
    // Validate
    const trimmedSubject = formSubject.trim();
    const trimmedMessage = formMessage.trim();

    if (!trimmedSubject) {
      showError("Please enter a subject for your ticket.", "Required");
      return;
    }

    if (trimmedMessage.length < 10) {
      showError("Please describe your issue in at least 10 characters.", "Too Short");
      return;
    }

    // Sanitize inputs
    const sanitizedSubject = trimmedSubject.replace(/[<>{}]/g, "");
    const sanitizedMessage = trimmedMessage.replace(/[<>{}]/g, "");
    const sanitizedBookingId = formBookingId
      .trim()
      .replace(/[^a-zA-Z0-9-]/g, "");

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // TODO: Call support ticket API
      // const response = await createSupportTicket({
      //   category: selectedCategory,
      //   subject: sanitizedSubject,
      //   message: sanitizedMessage,
      //   bookingId: sanitizedBookingId || undefined,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock ticket ID
      const mockTicketId = `SUP-${Date.now().toString().slice(-6)}`;
      setTicketId(mockTicketId);
      setCurrentView("ticket_submitted");

      Keyboard.dismiss();
    } catch (err) {
      if (__DEV__) {
        console.error("Submit ticket error:", err);
      }
      showError(
        "We couldn't submit your ticket. Please try again or contact us directly.",
        "Submission Failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formSubject, formMessage, formBookingId, selectedCategory, isSubmitting]);

  const handleBackNavigation = useCallback(() => {
    switch (currentView) {
      case "faq":
        setCurrentView("main");
        setSelectedCategory(null);
        break;
      case "contact_form":
        setCurrentView("faq");
        break;
      case "ticket_submitted":
        router.back();
        break;
      default:
        router.back();
    }
  }, [currentView, router]);

  const getHeaderTitle = useCallback(() => {
    switch (currentView) {
      case "main":
        return "Help & Support";
      case "faq":
        return (
          SUPPORT_OPTIONS.find((o) => o.category === selectedCategory)?.title ??
          "Help"
        );
      case "contact_form":
        return "Contact Us";
      case "ticket_submitted":
        return "Ticket Submitted";
      default:
        return "Support";
    }
  }, [currentView, selectedCategory]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackNavigation}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ══════════════════════════════════════════════════════════
              MAIN VIEW
              ══════════════════════════════════════════════════════════ */}
          {currentView === "main" && (
            <>
              {/* Hero */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.heroContainer}
              >
                <LinearGradient
                  colors={[THEME.PRIMARY, THEME.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroIconBg}>
                    <Ionicons name="headset" size={36} color="#FFF" />
                  </View>
                  <Text style={styles.heroTitle}>How can we help?</Text>
                  <Text style={styles.heroSubtitle}>
                    Choose a topic below or search our help center
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Search */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={styles.searchContainer}
              >
                <View style={styles.searchInputContainer}>
                  <Feather name="search" size={18} color={THEME.TEXT_MUTED} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search help articles..."
                    placeholderTextColor={THEME.TEXT_MUTED}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text.replace(/[<>{}]/g, ""));
                    }}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={100}
                    accessibilityLabel="Search help articles"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={THEME.TEXT_MUTED}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>

              {/* Search Results */}
              {searchQuery.trim().length >= 2 ? (
                <Animated.View entering={FadeInDown.springify()}>
                  <Text style={styles.searchResultsLabel}>
                    {filteredFAQs.length} result
                    {filteredFAQs.length !== 1 ? "s" : ""} found
                  </Text>
                  {filteredFAQs.map((faq, index) => (
                    <Animated.View
                      key={faq.id}
                      entering={FadeInRight.delay(index * 60).springify()}
                    >
                      <FAQCard
                        faq={faq}
                        isExpanded={expandedFAQ === faq.id}
                        onToggle={() => handleToggleFAQ(faq.id)}
                      />
                    </Animated.View>
                  ))}
                  {filteredFAQs.length === 0 && (
                    <EmptySearch
                      onContact={() => {
                        setSelectedCategory("other");
                        handleOpenContactForm();
                      }}
                    />
                  )}
                </Animated.View>
              ) : (
                <>
                  {/* Support Categories */}
                  <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Text style={styles.categoriesTitle}>
                      What do you need help with?
                    </Text>
                    <View style={styles.categoriesGrid}>
                      {SUPPORT_OPTIONS.map((option, index) => (
                        <Animated.View
                          key={option.id}
                          entering={FadeInRight.delay(
                            350 + index * 60,
                          ).springify()}
                        >
                          <CategoryCard
                            option={option}
                            onPress={() =>
                              handleCategorySelect(option.category)
                            }
                          />
                        </Animated.View>
                      ))}
                    </View>
                  </Animated.View>

                  {/* Contact Methods */}
                  <Animated.View entering={FadeInDown.delay(600).springify()}>
                    <Text style={styles.contactTitle}>
                      Or reach us directly
                    </Text>
                    {CONTACT_METHODS.map((method, index) => (
                      <Animated.View
                        key={method.id}
                        entering={FadeInRight.delay(
                          650 + index * 80,
                        ).springify()}
                      >
                        <ContactCard
                          method={method}
                          onPress={() => handleContactMethod(method)}
                        />
                      </Animated.View>
                    ))}
                  </Animated.View>
                </>
              )}

              {/* Booking Context */}
              {bookingId && (
                <Animated.View entering={FadeInDown.delay(700).springify()}>
                  <View style={styles.contextCard}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={THEME.PRIMARY}
                    />
                    <Text style={styles.contextText}>
                      Getting help for booking{" "}
                      <Text style={styles.contextBold}>#{bookingId}</Text>
                    </Text>
                  </View>
                </Animated.View>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              FAQ VIEW
              ══════════════════════════════════════════════════════════ */}
          {currentView === "faq" && (
            <>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                <Text style={styles.faqSubtitle}>
                  {filteredFAQs.length} article
                  {filteredFAQs.length !== 1 ? "s" : ""} in this category
                </Text>
              </Animated.View>

              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, index) => (
                  <Animated.View
                    key={faq.id}
                    entering={FadeInDown.delay(150 + index * 60).springify()}
                    layout={Layout.springify()}
                  >
                    <FAQCard
                      faq={faq}
                      isExpanded={expandedFAQ === faq.id}
                      onToggle={() => handleToggleFAQ(faq.id)}
                    />
                  </Animated.View>
                ))
              ) : (
                <EmptySearch onContact={handleOpenContactForm} />
              )}

              {/* Still Need Help */}
              <Animated.View entering={FadeInDown.delay(500).springify()}>
                <View style={styles.stillNeedHelpCard}>
                  <View style={styles.stillNeedHelpIcon}>
                    <Ionicons
                      name="help-buoy"
                      size={28}
                      color={THEME.PRIMARY}
                    />
                  </View>
                  <Text style={styles.stillNeedHelpTitle}>
                    Still need help?
                  </Text>
                  <Text style={styles.stillNeedHelpText}>
                    Can't find what you're looking for? Our support team is here
                    to help.
                  </Text>
                  <TouchableOpacity
                    style={styles.contactUsButton}
                    onPress={handleOpenContactForm}
                    accessibilityLabel="Contact support team"
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={[THEME.PRIMARY, THEME.SECONDARY]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.contactUsButtonGradient}
                    >
                      <Ionicons
                        name="chatbubble-ellipses"
                        size={18}
                        color="#FFF"
                      />
                      <Text style={styles.contactUsButtonText}>Contact Us</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              CONTACT FORM VIEW
              ══════════════════════════════════════════════════════════ */}
          {currentView === "contact_form" && (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Submit a Ticket</Text>
                <Text style={styles.formSubtitle}>
                  Describe your issue and we'll get back to you as soon as
                  possible
                </Text>

                {/* Category Display */}
                {selectedCategory && (
                  <View style={styles.formCategoryBadge}>
                    <Ionicons
                      name={
                        SUPPORT_OPTIONS.find(
                          (o) => o.category === selectedCategory,
                        )?.icon ?? "help-circle"
                      }
                      size={14}
                      color={THEME.PRIMARY}
                    />
                    <Text style={styles.formCategoryText}>
                      {SUPPORT_OPTIONS.find(
                        (o) => o.category === selectedCategory,
                      )?.title ?? "General"}
                    </Text>
                  </View>
                )}

                {/* Subject */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Subject *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Brief description of your issue"
                    placeholderTextColor={THEME.TEXT_MUTED}
                    value={formSubject}
                    onChangeText={(text) =>
                      setFormSubject(text.replace(/[<>{}]/g, ""))
                    }
                    maxLength={100}
                    accessibilityLabel="Subject"
                  />
                </View>

                {/* Booking ID (optional) */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    Booking ID{" "}
                    <Text style={styles.formLabelOptional}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. HLD-8392"
                    placeholderTextColor={THEME.TEXT_MUTED}
                    value={formBookingId}
                    onChangeText={(text) =>
                      setFormBookingId(text.replace(/[^a-zA-Z0-9-]/g, ""))
                    }
                    maxLength={20}
                    autoCapitalize="characters"
                    accessibilityLabel="Booking ID"
                  />
                </View>

                {/* Message */}
                <View style={styles.formField}>
                  <View style={styles.formLabelRow}>
                    <Text style={styles.formLabel}>Message *</Text>
                    <Text style={styles.formCharCount}>
                      {formMessage.length}/1000
                    </Text>
                  </View>
                  <TextInput
                    style={styles.formTextarea}
                    placeholder="Describe your issue in detail. Include any relevant information like dates, times, or item descriptions..."
                    placeholderTextColor={THEME.TEXT_MUTED}
                    value={formMessage}
                    onChangeText={(text) =>
                      setFormMessage(text.replace(/[<>{}]/g, ""))
                    }
                    multiline
                    numberOfLines={6}
                    maxLength={1000}
                    textAlignVertical="top"
                    accessibilityLabel="Message"
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitTicket}
                  disabled={isSubmitting}
                  accessibilityLabel="Submit support ticket"
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={
                      !isSubmitting
                        ? [THEME.PRIMARY, THEME.SECONDARY]
                        : ["#9ca3af", "#9ca3af"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButtonGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#FFF" />
                        <Text style={styles.submitButtonText}>
                          Submit Ticket
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.formDisclaimer}>
                  We typically respond within 2-4 hours during business hours.
                  For urgent issues, please call us directly.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════════════════
              TICKET SUBMITTED VIEW
              ══════════════════════════════════════════════════════════ */}
          {currentView === "ticket_submitted" && (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.successContainer}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={["#16a34a", "#22c55e"]}
                  style={styles.successIconGradient}
                >
                  <Ionicons name="checkmark-circle" size={48} color="#FFF" />
                </LinearGradient>
              </View>

              <Text style={styles.successTitle}>Ticket Submitted!</Text>
              <Text style={styles.successSubtitle}>
                We've received your support request and will get back to you
                shortly.
              </Text>

              <View style={styles.ticketIdCard}>
                <Text style={styles.ticketIdLabel}>YOUR TICKET ID</Text>
                <Text style={styles.ticketIdValue}>{ticketId}</Text>
                <Text style={styles.ticketIdHint}>
                  Save this ID for reference
                </Text>
              </View>

              <View style={styles.successTimeline}>
                <SuccessStep
                  step={1}
                  title="Ticket Received"
                  description="Your request has been logged"
                  isComplete
                />
                <SuccessStep
                  step={2}
                  title="Under Review"
                  description="Our team is reviewing your issue"
                  isCurrent
                />
                <SuccessStep
                  step={3}
                  title="Response Sent"
                  description="You'll be notified via email & push"
                />
              </View>

              <TouchableOpacity
                style={styles.successDoneButton}
                onPress={() => router.back()}
                accessibilityLabel="Return to previous screen"
                accessibilityRole="button"
              >
                <Text style={styles.successDoneText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successViewTicketButton}
                onPress={() => {
                  // TODO: Navigate to ticket detail
                  router.back();
                }}
                accessibilityLabel="View ticket details"
                accessibilityRole="button"
              >
                <Text style={styles.successViewTicketText}>
                  View My Tickets
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

const CategoryCard = ({
  option,
  onPress,
}: {
  option: SupportOption;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.categoryCard, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      activeOpacity={0.8}
      accessibilityLabel={`${option.title}: ${option.description}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.categoryIconBg,
          { backgroundColor: `${option.color}12` },
        ]}
      >
        <Ionicons name={option.icon} size={22} color={option.color} />
      </View>
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{option.title}</Text>
        <Text style={styles.categoryDesc} numberOfLines={2}>
          {option.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.TEXT_MUTED} />
    </AnimatedTouchable>
  );
};

const ContactCard = ({
  method,
  onPress,
}: {
  method: ContactMethod;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.contactCard}
    onPress={onPress}
    accessibilityLabel={`${method.label}: ${method.sublabel}`}
    accessibilityRole="button"
  >
    <View
      style={[styles.contactIconBg, { backgroundColor: `${method.color}12` }]}
    >
      <Ionicons name={method.icon} size={20} color={method.color} />
    </View>
    <View style={styles.contactContent}>
      <Text style={styles.contactLabel}>{method.label}</Text>
      <Text style={styles.contactSublabel}>{method.sublabel}</Text>
    </View>
    <Ionicons name="arrow-forward-circle" size={24} color={method.color} />
  </TouchableOpacity>
);

const FAQCard = ({
  faq,
  isExpanded,
  onToggle,
}: {
  faq: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
    onPress={onToggle}
    activeOpacity={0.8}
    accessibilityLabel={`${faq.question}. ${isExpanded ? faq.answer : "Tap to expand"}`}
    accessibilityRole="button"
    accessibilityState={{ expanded: isExpanded }}
  >
    <View style={styles.faqHeader}>
      <Text
        style={[styles.faqQuestion, isExpanded && styles.faqQuestionExpanded]}
      >
        {faq.question}
      </Text>
      <Ionicons
        name={isExpanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={isExpanded ? THEME.PRIMARY : THEME.TEXT_MUTED}
      />
    </View>
    {isExpanded && (
      <Animated.View entering={FadeInDown.duration(200)}>
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
        <View style={styles.faqFeedback}>
          <Text style={styles.faqFeedbackLabel}>Was this helpful?</Text>
          <View style={styles.faqFeedbackButtons}>
            <TouchableOpacity
              style={styles.faqFeedbackBtn}
              accessibilityLabel="Yes, this was helpful"
              accessibilityRole="button"
            >
              <Ionicons
                name="thumbs-up-outline"
                size={16}
                color={THEME.TEXT_MUTED}
              />
              <Text style={styles.faqFeedbackText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.faqFeedbackBtn}
              accessibilityLabel="No, this was not helpful"
              accessibilityRole="button"
            >
              <Ionicons
                name="thumbs-down-outline"
                size={16}
                color={THEME.TEXT_MUTED}
              />
              <Text style={styles.faqFeedbackText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    )}
  </TouchableOpacity>
);

const EmptySearch = ({ onContact }: { onContact: () => void }) => (
  <View style={styles.emptySearchContainer}>
    <View style={styles.emptySearchIcon}>
      <Ionicons name="search-outline" size={36} color={THEME.TEXT_MUTED} />
    </View>
    <Text style={styles.emptySearchTitle}>No results found</Text>
    <Text style={styles.emptySearchText}>
      We couldn't find an answer. Contact our team for help.
    </Text>
    <TouchableOpacity
      style={styles.emptySearchButton}
      onPress={onContact}
      accessibilityLabel="Contact support"
      accessibilityRole="button"
    >
      <Text style={styles.emptySearchButtonText}>Contact Support</Text>
    </TouchableOpacity>
  </View>
);

const SuccessStep = ({
  step,
  title,
  description,
  isComplete,
  isCurrent,
}: {
  step: number;
  title: string;
  description: string;
  isComplete?: boolean;
  isCurrent?: boolean;
}) => (
  <View style={styles.successStep}>
    <View
      style={[
        styles.successStepDot,
        isComplete && styles.successStepDotComplete,
        isCurrent && styles.successStepDotCurrent,
      ]}
    >
      {isComplete ? (
        <Ionicons name="checkmark" size={12} color="#FFF" />
      ) : (
        <Text
          style={[styles.successStepNumber, isCurrent && { color: "#FFF" }]}
        >
          {step}
        </Text>
      )}
    </View>
    <View style={styles.successStepContent}>
      <Text
        style={[
          styles.successStepTitle,
          (isComplete || isCurrent) && { fontWeight: "700" },
        ]}
      >
        {title}
      </Text>
      <Text style={styles.successStepDesc}>{description}</Text>
    </View>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    textAlign: "center",
  },
  headerSpacer: {
    width: 38,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Hero
  heroContainer: {
    marginBottom: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  heroIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },

  // Search
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.TEXT_DARK,
  },
  searchResultsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    marginBottom: 12,
  },

  // Categories
  categoriesTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 14,
  },
  categoriesGrid: {
    gap: 10,
    marginBottom: 28,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  categoryDesc: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
    lineHeight: 17,
  },

  // Contact
  contactTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 14,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  contactSublabel: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },

  // Context Card
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}08`,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  contextText: {
    fontSize: 13,
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  contextBold: {
    fontWeight: "700",
    color: THEME.PRIMARY,
  },

  // FAQ
  faqTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 4,
  },
  faqSubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  faqCardExpanded: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.PRIMARY,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    flex: 1,
    lineHeight: 20,
  },
  faqQuestionExpanded: {
    color: THEME.PRIMARY,
    fontWeight: "700",
  },
  faqAnswer: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    lineHeight: 21,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  faqFeedback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  faqFeedbackLabel: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
  },
  faqFeedbackButtons: {
    flexDirection: "row",
    gap: 8,
  },
  faqFeedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  faqFeedbackText: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.TEXT_MUTED,
  },

  // Still Need Help
  stillNeedHelpCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  stillNeedHelpIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  stillNeedHelpTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 6,
  },
  stillNeedHelpText: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  contactUsButton: {
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  contactUsButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  contactUsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },

  // Form
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginBottom: 20,
    lineHeight: 19,
  },
  formCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: `${THEME.PRIMARY}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 20,
  },
  formCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },
  formField: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  formLabelOptional: {
    fontWeight: "400",
    color: THEME.TEXT_MUTED,
  },
  formLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  formCharCount: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
  },
  formInput: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 14,
    color: THEME.TEXT_DARK,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  formTextarea: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: THEME.TEXT_DARK,
    minHeight: 140,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  formDisclaimer: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 17,
  },

  // Empty Search
  emptySearchContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySearchIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 6,
  },
  emptySearchText: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    marginBottom: 16,
  },
  emptySearchButton: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptySearchButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },

  // Success
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ticketIdCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderStyle: "dashed",
  },
  ticketIdLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  ticketIdValue: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.PRIMARY,
    letterSpacing: 2,
    marginBottom: 4,
  },
  ticketIdHint: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
  },

  // Success Timeline
  successTimeline: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  successStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  successStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.06)",
  },
  successStepDotComplete: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  successStepDotCurrent: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  successStepNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
  },
  successStepContent: {
    flex: 1,
    paddingTop: 2,
  },
  successStepTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  successStepDesc: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  successDoneButton: {
    width: "100%",
    backgroundColor: THEME.PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  successDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  successViewTicketButton: {
    paddingVertical: 12,
  },
  successViewTicketText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },

  bottomSpacer: {
    height: 40,
  },
});
