import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import ColorIndicator from "@/components/Lessons/ColorIndicator";
import { TimetableClass } from "@/services/shared/Timetable";

import Reanimated, {
  FadeInDown,
  FadeOut,
  LinearTransition
} from "react-native-reanimated";


import NativeTouchable from "@/components/Global/NativeTouchable";
import { getSubjectData } from "@/services/shared/Subject";
import { animPapillon } from "@/utils/ui/animations";

const lz = (num: number) => (num < 10 ? `0${num}` : num);

const getDuration = (minutes: number): string => {
  const durationHours = Math.floor(minutes / 60);
  const durationRemainingMinutes = minutes % 60;
  return `${durationHours} h ${lz(durationRemainingMinutes)} min`;
};

export const TimetableItem: React.FC<{
  item: TimetableClass
  index: number
  small?: boolean
}> = ({ item, index, small }) => {
  const start = useMemo(() => new Date(item.startTimestamp), [item.startTimestamp]);
  const end = useMemo(() => new Date(item.endTimestamp), [item.endTimestamp]);
  const { colors } = useTheme();

  const durationMinutes = useMemo(() => Math.round((item.endTimestamp - item.startTimestamp) / 60000), [item.startTimestamp, item.endTimestamp]);

  const [subjectData, setSubjectData] = useState({ color: "#888888", pretty: "Matière inconnue" });

  const fetchSubjectData = () => {
    const data = getSubjectData(item.title);
    setSubjectData(data);
  };

  fetchSubjectData();

  const formattedStartTime = useMemo(() => start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), [start]);
  const formattedEndTime = useMemo(() => end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), [end]);

  return (
    <Reanimated.View
      style={styles.itemContainer}
      entering={Platform.OS === "ios" ? FadeInDown.delay((50 * index)).springify().mass(1).damping(20).stiffness(300) : void 0}
      exiting={Platform.OS === "ios" ? FadeOut.duration(300) : void 0}
      key={item.title + item.startTimestamp}
      layout={animPapillon(LinearTransition)}
    >
      <View style={[styles.timeContainer, small && styles.timeContainerSmall]}>
        <Text style={[styles.timeText, { color: colors.text }]}>{formattedStartTime}</Text>
        <Text style={[styles.timeTextSec, { color: colors.text }]}>{formattedEndTime}</Text>
      </View>

      <NativeTouchable
        style={[styles.detailsContainer, { backgroundColor: colors.card, borderColor: colors.text + "33" }]}
        underlayColor={colors.text + "11"}
      >
        <View style={[{ flex: 1, flexDirection: "column", overflow: "hidden", borderRadius: 10 }]}>
          {item.status && (
            <View style={[styles.statusContainer, { backgroundColor: subjectData.color + "33" }]}>
              <Text style={[styles.statusText, { color: subjectData.color }]}>{item.status}</Text>
            </View>
          )}
          <View style={[{ flex: 1, flexDirection: "row", padding: 10 }]}>
            <View style={styles.colorIndicator}>
              <ColorIndicator color={subjectData.color} />
            </View>

            <View style={{ flexDirection: "column", flexShrink: 1, gap: 6, flex: 1 }}>
              <Text numberOfLines={2} style={[styles.titleText, { color: colors.text }]}>{subjectData.pretty || "Cours inconnu"}</Text>

              <View style={[styles.roomTextContainer, { backgroundColor: subjectData.color + "33" }]}>
                <Text numberOfLines={1} style={[styles.roomText, { color: subjectData.color }]}>{item.room || "Salle inconnue"}</Text>
              </View>

              {durationMinutes > 89 && !small && <View style={{ height: 24 }} />}

              {!small && (
                <View style={{ flexDirection: "row", flex: 1 }}>
                  <Text numberOfLines={2} style={[styles.locationText, { color: colors.text }]}>{item.teacher || "Professeur inconnu"}</Text>
                  <Text style={[styles.durationText, { color: colors.text }]}>{getDuration(durationMinutes)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </NativeTouchable>
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    borderRadius: 5,
    marginVertical: 0,
  },
  timeContainer: {
    flex: 0,
    minWidth: 60,
    paddingHorizontal: 5,
    alignItems: "center",
    gap: 5,
  },
  timeContainerSmall: {
    minWidth: 40,
  },
  timeText: {
    fontSize: 17,
    fontFamily: "semibold",
  },
  timeTextSec: {
    fontSize: 15,
    fontFamily: "medium",
    opacity: 0.5,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 0.5,
    borderRadius: 10,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  colorIndicator: {
    marginRight: 10,
  },
  titleText: {
    fontFamily: "semibold",
    fontSize: 17,
  },
  roomTextContainer: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 5,
    flexWrap: "wrap",
    overflow: "hidden",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  roomText: {
    color: "#91003F",
    fontSize: 16,
    fontFamily: "semibold",
    letterSpacing: 0.5,
    maxWidth: "100%",
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  durationText: {
    fontSize: 14,
    opacity: 0.5,
    alignSelf: "flex-end",
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 14.5,
    fontFamily: "semibold",
  },
});