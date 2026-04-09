import React, { useCallback, useMemo, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { THEME } from "@/theme/theme";
import { useActiveBooking } from "@/features/booking/bookingQueries";
import { formatDateForDisplay } from "@/utils/date";
import { Image, Modal, Alert } from "react-native";
import { useCancelBooking } from "@/features/booking/bookingQueries";
import { showError, showSuccess } from "@/utils/toast";

// --- UTILS ---
const getStatusMeta = (status: string) => {
    switch (status) {
        case "created":
        case "confirmed":
            return {
                label: "Order Status",
                title: "Finding your driver",
                eta: "3 mins",
                color: THEME.PRIMARY,
                icon: "map-marker-radius-outline" as const,
                description: "Our system is assigning the nearest driver to your pickup.",
                banner: "Sit tight! A delivery partner will shortly be assigned",
                illustration: "https://cdn-icons-png.flaticon.com/512/625/625946.png" // Suitcase icon
            };
        case "driver_assigned":
        case "pickup_scheduled":
            return {
                label: "Arriving in",
                title: "Your driver is on the way",
                eta: "5 mins",
                color: THEME.PRIMARY,
                icon: "truck-delivery-outline" as const,
                description: "A driver is assigned to your pickup and heading to you.",
                banner: "Sit tight! A delivery partner is arriving soon",
                illustration: "https://cdn-icons-png.flaticon.com/512/713/713311.png" // Delivery person icon
            };
        case "picked_up":
            return {
                label: "Status",
                title: "Items Picked Up",
                eta: "In Transit",
                color: "#16a34a",
                icon: "package-variant-closed" as const,
                description: "Your luggage is safe with us and moving to our store.",
                banner: "Your items are being transported safely",
                illustration: "https://cdn-icons-png.flaticon.com/512/625/625946.png"
            };
        case "in_storage":
        case "at_store":
        case "stored":
            return {
                label: "Status",
                title: "Stored Securely",
                eta: "Protected",
                color: "#16a34a",
                icon: "shield-check-outline" as const,
                description: "Your items are safe in our climate-controlled facility.",
                banner: "Your luggage is now secured at the store",
                illustration: "https://cdn-icons-png.flaticon.com/512/625/625946.png"
            };
        default:
            return {
                label: "Status",
                title: status.replace("_", " ").toUpperCase(),
                eta: "Processing",
                color: THEME.TEXT_MUTED,
                icon: "information-outline" as const,
                description: "Processing your booking request...",
                banner: "We are updating your order status",
                illustration: "https://cdn-icons-png.flaticon.com/512/625/625946.png"
            };
    }
};

const ProgressTimeline = ({ status }: { status: string }) => {
    const steps = [
        { key: ["created", "confirmed"], label: "Confirmed" },
        { key: ["driver_assigned", "pickup_scheduled"], label: "Driver Assigned" },
        { key: ["picked_up"], label: "Picked Up" },
        { key: ["in_storage", "at_store", "stored"], label: "Stored" },
    ];

    const currentStepIndex = steps.findIndex(s => s.key.includes(status));
    
    return (
        <View style={styles.timelineContainer}>
            {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isProcessing = index === currentStepIndex;
                return (
                    <View key={index} style={styles.timelineStepWrapper}>
                        <View style={styles.timelineItem}>
                            <View style={[
                                styles.timelineDot,
                                isActive && { backgroundColor: THEME.PRIMARY },
                                isProcessing && styles.timelineDotActive
                            ]}>
                                {isActive && <Ionicons name="checkmark" size={10} color="#FFF" />}
                            </View>
                            <Text style={[
                                styles.timelineLabel,
                                isActive && { color: THEME.TEXT_DARK, fontWeight: "800" }
                            ]}>{step.label}</Text>
                        </View>
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.timelineLine,
                                index < currentStepIndex && { backgroundColor: THEME.PRIMARY }
                            ]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

// --- COMPONENTS ---

const OrderStatusView = ({ booking, onManage, onShowLuggage, onCancel }: { 
    booking: any; 
    onManage: () => void; 
    onShowLuggage: () => void;
    onCancel: () => void;
}) => {
    const meta = useMemo(() => getStatusMeta(booking.status), [booking.status]);
    const bookingId = (booking._id || booking.id || "").slice(-8).toUpperCase();

    const totalItems = useMemo(() => {
        if (!booking.luggage) return 0;
        return Object.values(booking.luggage).reduce((sum: number, val: any) => {
            return typeof val === 'number' ? sum + val : sum;
        }, 0);
    }, [booking.luggage]);

    return (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.activeContainer}>
            {/* 1. Main Status Card (Zepto Style) */}
            <View style={styles.statusMainCard}>
                <View style={styles.statusContentRow}>
                    <View style={styles.statusTextCol}>
                        <Text style={styles.etaLabel}>{meta.label}</Text>
                        <Text style={[styles.etaValue, { color: meta.color }]}>{meta.eta}</Text>
                        
                        <Text style={styles.mainStatusTitle}>{meta.title}</Text>
                        <Text style={styles.mainStatusSub}>{meta.description}</Text>
                    </View>
                    <Image 
                        source={{ uri: meta.illustration }} 
                        style={styles.statusIllustration}
                    />
                </View>

                {/* Progress Timeline */}
                <ProgressTimeline status={booking.status} />

                {/* 2. Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: `${meta.color}10`, borderColor: `${meta.color}30` }]}>
                    <Text style={[styles.statusBannerText, { color: meta.color }]}>{meta.banner}</Text>
                </View>

                {/* 3. Partner Block */}
                <View style={styles.partnerBlock}>
                    <View style={styles.partnerAvatarBox}>
                        {booking.driver ? (
                            <Image 
                                source={{ uri: "https://ui-avatars.com/api/?name=" + booking.driver.first_name + "&background=7c3aed&color=fff" }} 
                                style={styles.partnerAvatar}
                            />
                        ) : (
                            <View style={styles.partnerPlaceholder}>
                                <Ionicons name="person" size={20} color={THEME.PRIMARY} />
                            </View>
                        )}
                    </View>
                    <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>{booking.driver ? `${booking.driver.first_name} ${booking.driver.last_name}` : "Assigning Partner..."}</Text>
                        <Text style={styles.partnerRole}>{booking.driver ? "Contact Delivery Partner" : "A partner will be assigned shortly"}</Text>
                    </View>
                    {booking.driver && (
                        <TouchableOpacity style={styles.callIconBtn}>
                            <Ionicons name="call" size={20} color={THEME.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.cardDivider} />

                {/* 4. Order Details Block */}
                <TouchableOpacity style={styles.orderSummaryRow} onPress={onShowLuggage}>
                    <View style={styles.orderIconBox}>
                        <Image 
                            source={{ uri: "https://cdn-icons-png.flaticon.com/512/2815/2815428.png" }} 
                            style={{ width: 22, height: 22 }}
                        />
                    </View>
                    <View style={styles.orderInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.orderItemsCount}>{totalItems} Items</Text>
                            <Ionicons name="chevron-forward" size={12} color={THEME.TEXT_DARK_SECONDARY} />
                        </View>
                        <Text style={styles.orderAddress} numberOfLines={1}>
                            Pickup from: {booking.pickup?.address || "Current Location"}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Premium Safety Badge */}
                <View style={styles.safetyBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
                    <Text style={styles.safetyBadgeText}>Your items are 100% insured & secured by Holdit Safety Guarantee</Text>
                </View>
            </View>

            {/* Help Button */}
            <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="chatbubble-ellipses" size={20} color={THEME.TEXT_DARK} />
                <Text style={styles.helpButtonText}>Help / Support</Text>
            </TouchableOpacity>

            {/* Manage Booking Card (Secondary) */}
            <TouchableOpacity style={styles.manageCardSmall} onPress={onManage}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.manageCardTitle}>Manage Booking</Text>
                    <Text style={styles.manageCardSub}>View full timeline or itemized receipt</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={THEME.PRIMARY} />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelScheduleBtn} onPress={onCancel}>
                <Text style={styles.cancelScheduleText}>Cancel Schedule</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ScheduleScreen() {
    const router = useRouter();
    const scrollY = useSharedValue(0);
    const [showLuggageSheet, setShowLuggageSheet] = React.useState(false);
    
    const { data: activeBookingResponse, isLoading, isError, refetch } = useActiveBooking();
    const cancelMutation = useCancelBooking();

    const activeBooking = useMemo(() => {
        if (!activeBookingResponse) return null;
        return activeBookingResponse.bookings?.[0] ||
            (activeBookingResponse._id ? activeBookingResponse : null);
    }, [activeBookingResponse]);

    useEffect(() => {
        if (!isLoading && !activeBooking) {
            router.replace("/book-now");
        }
    }, [isLoading, activeBooking]);

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const handleCancel = () => {
        if (!activeBooking) return;
        Alert.alert(
            "Cancel Schedule?",
            "Are you sure you want to cancel your luggage storage schedule?",
            [
                { text: "No, Keep it", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: () => {
                        cancelMutation.mutate(
                            { id: activeBooking._id || activeBooking.id, reason: "User cancelled" },
                            {
                                onSuccess: () => {
                                    showSuccess("Booking cancelled successfully");
                                    router.replace("/book-now");
                                },
                                onError: (err) => {
                                    showError(err.message || "Failed to cancel booking");
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.PRIMARY} />
                <Text style={styles.loadingText}>Synchronizing your schedule...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline-outline" size={64} color={THEME.TEXT_MUTED} />
                <Text style={styles.errorTitle}>Connection Issues</Text>
                <Text style={styles.errorSubtitle}>We couldn't reach the server. Please check your internet.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!activeBooking) return null;

    return (
        <View style={styles.container}>
            <SafeAreaView edges={["top"]} style={styles.screenHeader}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Order Status</Text>
                <TouchableOpacity style={styles.helpBtn}>
                    <Ionicons name="help-circle-outline" size={22} color={THEME.TEXT_DARK} />
                    <Text style={styles.helpBtnText}>Help</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                        tintColor={THEME.PRIMARY}
                    />
                }
            >
                <OrderStatusView
                    booking={activeBooking}
                    onManage={() => {
                        const bid = activeBooking._id || activeBooking.id;
                        router.push({ pathname: "/booking/[id]", params: { id: bid } });
                    }}
                    onShowLuggage={() => setShowLuggageSheet(true)}
                    onCancel={handleCancel}
                />
            </Animated.ScrollView>

            {/* LUGGAGE DETAILS MODAL */}
            <Modal
                visible={showLuggageSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLuggageSheet(false)}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={1} 
                        onPress={() => setShowLuggageSheet(false)} 
                    />
                    <View style={styles.luggageSheet}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Luggage Breakdown</Text>
                            <TouchableOpacity onPress={() => setShowLuggageSheet(false)}>
                                <Ionicons name="close-circle" size={28} color={THEME.TEXT_MUTED} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.luggageList}>
                            {activeBooking.luggage && Object.entries(activeBooking.luggage).map(([key, count]: [string, any]) => {
                                if (typeof count !== 'number' || count === 0) return null;
                                return (
                                    <View key={key} style={styles.luggageItem}>
                                        <View style={styles.luggageIconWrapper}>
                                            <Ionicons 
                                                name={key === 'small' ? 'briefcase' : key === 'medium' ? 'business' : 'airplane'} 
                                                size={20} 
                                                color={THEME.PRIMARY} 
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.luggageLabel}>{key.toUpperCase()}</Text>
                                            <Text style={styles.luggageCount}>{count} item{count > 1 ? 's' : ''}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <TouchableOpacity 
                            style={styles.closeSheetBtn}
                            onPress={() => setShowLuggageSheet(false)}
                        >
                            <Text style={styles.closeSheetBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND_LIGHT,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: THEME.BACKGROUND_LIGHT,
    },
    loadingText: {
        marginTop: 12,
        color: THEME.TEXT_MUTED,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
        marginTop: 16,
    },
    errorSubtitle: {
        fontSize: 14,
        fontWeight: "600",
        color: THEME.TEXT_DARK_SECONDARY,
        textAlign: "center",
        marginTop: 8,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: THEME.PRIMARY,
    },
    retryText: {
        color: "#FFF",
        fontWeight: "800",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    activeContainer: {
        gap: 16,
    },
    // Progress Timeline
    timelineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginVertical: 20,
    },
    timelineStepWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineItem: {
        alignItems: 'center',
        zIndex: 1,
    },
    timelineDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineDotActive: {
        borderWidth: 3,
        borderColor: `${THEME.PRIMARY}40`,
    },
    timelineLabel: {
        fontSize: 9,
        color: THEME.TEXT_MUTED,
        marginTop: 6,
        textAlign: 'center',
        position: 'absolute',
        top: 18,
        width: 60,
    },
    timelineLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -5,
    },
    // Safety Badge
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 10,
        borderRadius: 10,
        marginTop: 16,
        gap: 8,
    },
    safetyBadgeText: {
        fontSize: 10,
        color: '#166534',
        fontWeight: '600',
        flex: 1,
    },
    // New Zepto Style Redesign
    statusMainCard: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: THEME.BORDER_LIGHT,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    statusContentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    statusTextCol: {
        flex: 1,
    },
    etaLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: THEME.TEXT_DARK_SECONDARY,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    etaValue: {
        fontSize: 32,
        fontWeight: "900",
        marginVertical: 4,
    },
    mainStatusTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
        marginTop: 8,
    },
    mainStatusSub: {
        fontSize: 13,
        color: THEME.TEXT_DARK_SECONDARY,
        marginTop: 4,
        lineHeight: 18,
    },
    statusIllustration: {
        width: 100,
        height: 100,
        resizeMode: "contain",
    },
    statusBanner: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    statusBannerText: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },
    partnerBlock: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        padding: 12,
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
    },
    partnerAvatarBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: THEME.BORDER_LIGHT,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    partnerAvatar: {
        width: "100%",
        height: "100%",
    },
    partnerPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    partnerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    partnerName: {
        fontSize: 15,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    partnerRole: {
        fontSize: 12,
        color: THEME.TEXT_DARK_SECONDARY,
        fontWeight: "600",
    },
    callIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: THEME.BORDER_LIGHT,
    },
    cardDivider: {
        height: 1,
        backgroundColor: THEME.BORDER_LIGHT,
        marginVertical: 20,
    },
    orderSummaryRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    orderIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
    },
    orderInfo: {
        flex: 1,
        marginLeft: 14,
    },
    orderItemsCount: {
        fontSize: 15,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    orderAddress: {
        fontSize: 12,
        color: THEME.TEXT_DARK_SECONDARY,
        marginTop: 2,
    },
    helpButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "700",
        color: THEME.TEXT_DARK,
    },
    manageCardSmall: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: THEME.BORDER_LIGHT,
    },
    manageCardTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    manageCardSub: {
        fontSize: 12,
        color: THEME.TEXT_DARK_SECONDARY,
        marginTop: 2,
    },
    cancelScheduleBtn: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelScheduleText: {
        color: "#EF4444",
        fontSize: 14,
        fontWeight: "800",
        textDecorationLine: "underline",
    },
    helpButton: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: THEME.BORDER_LIGHT,
    },
    // Header
    screenHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: THEME.BORDER_LIGHT,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
    },
    screenTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: THEME.TEXT_DARK,
    },
    helpBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    helpBtnText: {
        fontSize: 12,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    luggageSheet: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E2E8F0",
        alignSelf: "center",
        marginBottom: 20,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: THEME.TEXT_DARK,
    },
    luggageList: {
        gap: 12,
    },
    luggageItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        gap: 16,
    },
    luggageIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: THEME.TRANSPARENT_PRIMARY,
        justifyContent: "center",
        alignItems: "center",
    },
    luggageLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: THEME.TEXT_DARK_SECONDARY,
        letterSpacing: 0.5,
    },
    luggageCount: {
        fontSize: 16,
        fontWeight: "900",
        color: THEME.TEXT_DARK,
        marginTop: 2,
    },
    closeSheetBtn: {
        backgroundColor: THEME.PRIMARY,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 24,
    },
    closeSheetBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "800",
    },
});
