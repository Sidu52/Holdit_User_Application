import React from "react";
import { TouchableOpacity, Text } from "react-native";

export default function Button({ title, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-black py-3 rounded-lg"
    >
      <Text className="text-white text-center font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  );
}
