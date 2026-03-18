import React, { useEffect } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { THEME } from "@/constants/theme";
import Skeleton from "./Skeleton";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TruckLoader() {
  // Shared values for animations
  const moveX = useSharedValue(0); // For road and lamp post
  const bounceY = useSharedValue(0); // For truck suspension

  useEffect(() => {
    // Road/Lamp post movement (right to left)
    moveX.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );

    // Truck bounce effect (up and down)
    bounceY.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  // Truck bounce style
  const truckAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  // Objects moving right to left
  const roadObjectsStyle = useAnimatedStyle(() => {
    const translateX = interpolate(moveX.value, [0, 1], [0, -350]);
    return { transform: [{ translateX }] };
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      {/* Add Sckeleton here */}
      <View style={styles.skeletonContainer}>
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonHeader} />
        <Skeleton style={styles.skeltonSubHeading} />
      </View>
      <View style={styles.loaderContainer}>
        <View style={styles.truckWrapper}>
          {/* LAMP POST (Moving) */}
          <Animated.View style={[styles.lampPostContainer, roadObjectsStyle]}>
            <Svg viewBox="0 0 453.459 453.459" width={90} height={90}>
              <Path
                fill="#282828"
                d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993 c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514 c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16 c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914 h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75 v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795 V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017 h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
              />
            </Svg>
          </Animated.View>

          {/* TRUCK BODY (Bouncing) */}
          <Animated.View style={[styles.truckBody, truckAnimationStyle]}>
            <Svg width={130} height={60} viewBox="0 0 198 93">
              <Path
                stroke="#282828"
                strokeWidth="3"
                fill="#F83D3D"
                d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
              />
              <Path
                stroke="#282828"
                strokeWidth="3"
                fill="#7D7C7C"
                d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
              />
              <Rect
                x="6.5"
                y="1.5"
                width="121"
                height="90"
                rx="2.5"
                fill="#DFDFDF"
                stroke="#282828"
                strokeWidth="3"
              />
            </Svg>
          </Animated.View>

          {/* TIRES */}
          <View style={styles.truckTires}>
            <TireSvg />
            <TireSvg />
          </View>

          {/* ROAD LINE */}
          <View style={styles.road}>
            <Animated.View style={[styles.roadMarkers, roadObjectsStyle]}>
              <View style={styles.roadMarker} />
              <View style={[styles.roadMarker, { marginLeft: 40 }]} />
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const TireSvg = () => (
  <Svg width={24} height={24} viewBox="0 0 30 30">
    <Circle
      cx="15"
      cy="15"
      r="13.5"
      fill="#282828"
      stroke="#282828"
      strokeWidth="3"
    />
    <Circle cx="15" cy="15" r="7" fill="#DFDFDF" />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  skeletonLine: {
    width: "35%",
    height: 15,
    backgroundColor: THEME.SKELETON_COLOR_LIGHT,
    borderRadius: 10,
  },
  skeletonHeader: {
    width: "60%",
    height: 30,
    borderRadius: 10,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: THEME.SKELETON_COLOR_LIGHT,
    animationDirection: "alternate",
  },
  skeltonSubHeading: {
    width: "90%",
    height: 30,
    borderRadius: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: THEME.SKELETON_COLOR_LIGHT,
  },
  truckWrapper: {
    width: 200,
    height: 100,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  truckBody: {
    marginBottom: 12,
    zIndex: 2,
  },
  truckTires: {
    width: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 5,
    paddingHorizontal: 5,
    zIndex: 3,
  },
  road: {
    width: "100%",
    height: 2,
    backgroundColor: "#282828",
    borderRadius: 3,
  },
  roadMarkers: {
    flexDirection: "row",
    position: "absolute",
    right: -100,
    top: 0,
  },
  roadMarker: {
    width: 20,
    height: 2,
    backgroundColor: "#282828",
    borderLeftWidth: 10,
    borderLeftColor: "#FFF",
  },
  lampPostContainer: {
    position: "absolute",
    bottom: 0,
    right: -100,
    zIndex: 1,
  },
});
