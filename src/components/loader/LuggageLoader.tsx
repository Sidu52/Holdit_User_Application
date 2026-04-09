import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Video from 'react-native-video';
const LuggageLoader = () => {
    return (
        <View style={styles.container}>

            <View style={styles.center}>
                {/* <Video
                    source={require("../../assets/video/male-passenger-with-suitcases.mp4")}
                    shouldPlay
                    isLooping
                    resizeMode={ResizeMode.COVER}
                    style={{ width: 120, height: 120 }}
                /> */}
                <Text style={styles.text}>
                    Loading...
                </Text>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6F8",
        justifyContent: "space-between",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        marginTop: 15,
        fontSize: 14,
        color: "#8A8F98",
    },
});

export default LuggageLoader;