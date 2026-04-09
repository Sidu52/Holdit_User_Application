import React from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import { useAutoCarousel } from "@/hooks/useAutoCarousel";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 260;

type TipItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type Props = {
  title?: string;
  data: TipItem[];
};

export const TipsSafetySection: React.FC<Props> = ({
  title = "Tips & Safety",
  data,
}) => {
  const infiniteData = React.useMemo(() => [...data, ...data], [data]);

  const carouselRef = useAutoCarousel({
    dataLength: data.length,
    itemWidth: CARD_WIDTH + 16,
  });

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>

      <FlatList
        ref={carouselRef}
        data={infiniteData}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
  },

  heading: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1c190d",
  },

  list: {
    paddingHorizontal: 16,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#e8e4ce",
  },

  icon: {
    fontSize: 26,
    marginBottom: 8,
    color: "#FACC15",
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    color: "#1c190d",
  },

  cardDesc: {
    fontSize: 12,
    color: "rgba(28,25,13,0.6)",
    lineHeight: 16,
  },
});
