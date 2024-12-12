import React, { useEffect, useState, useCallback } from "react";
import { Clock, Paperclip, Sparkles } from "lucide-react-native";
import { getSubjectData } from "@/services/shared/Subject";
import { useRoute, useTheme } from "@react-navigation/native";
import { NativeItem, NativeText } from "@/components/Global/NativeComponents";
import PapillonCheckbox from "@/components/Global/PapillonCheckbox";
import Reanimated, { LinearTransition } from "react-native-reanimated";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { animPapillon } from "@/utils/ui/animations";
import HTMLView from "react-native-htmlview";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteParameters } from "@/router/helpers/types";
import { StyleSheet, View } from "react-native";
import { Homework, HomeworkReturnType } from "@/services/shared/Homework";
import detectCategory from "@/utils/magic/categorizeHomeworks";
import { LinearGradient } from "expo-linear-gradient";
import { useCurrentAccount } from "@/stores/account";
import LinkFavicon, { getURLDomain } from "@/components/Global/LinkFavicon";
import { AutoFileIcon } from "@/components/Global/FileIcon";

interface HomeworkItemProps {
    key: number | string;
    index: number;
    total: number;
    homework: Homework;
    onDonePressHandler: () => unknown;
    navigation: NativeStackNavigationProp<
        RouteParameters,
        "HomeScreen" | "Homeworks",
        undefined
    >;
}

const HomeworkItem = ({
    homework,
    navigation,
    onDonePressHandler,
    index,
    total,
}: HomeworkItemProps) => {
    const theme = useTheme();
    const [subjectData, setSubjectData] = useState(
        getSubjectData(homework.subject)
    );
    const [category, setCategory] = useState<string | null>(null);
    const account = useCurrentAccount((store) => store.account!);
    const content = homework.content.replace(
        /(https?:\/\/[^\s<>"']+)/g,
        (match) => {
            const linkText = match.replace(/^https?:\/\//, "");
            return `<a href="${match}" target="_blank">${linkText}</a>`;
        }
    );
    
    const route = useRoute();

    const stylesText = StyleSheet.create({
        body: {
            color: homework.done ? theme.colors.text + "80" : theme.colors.text,
            fontFamily: "medium",
            fontSize: 16,
            lineHeight: 22,
        },
    });

    useEffect(() => {
        if (account.personalization?.MagicHomeworks) {
            const data = getSubjectData(homework.subject);
            setSubjectData(data);
            const detectedCategory = detectCategory(homework.content);
            setCategory(detectedCategory);
        } else {
            setCategory(null);
        }
    }, [homework.subject, homework.content]);

    const [isLoading, setIsLoading] = useState(false);

    const handlePress = useCallback(() => {
        setIsLoading(true);
        onDonePressHandler();
    }, [onDonePressHandler]);

    const [mainLoaded, setMainLoaded] = useState(false);

    useEffect(() => {
        setIsLoading(false);
        setMainLoaded(true);
    }, [homework.done]);

    const timestampToString = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();

        const difference = Math.ceil(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return difference === 0
            ? "Aujourd'hui"
            : difference === 1
            ? "Demain"
            : difference === 2
            ? "Après-demain"
            : `Dans ${difference} jours`;
    };

    const renderCategoryOrReturnType = () => {
        if (category) {
            return (
                <LinearGradient
                    colors={[subjectData.color + "80", subjectData.color]}
                    style={{
                        borderRadius: 50,
                        zIndex: 10,
                        borderWidth: 1,
                        borderColor: theme.colors.text + "20",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingVertical: 3,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                        }}
                    >
                        <Sparkles
                            size={14}
                            strokeWidth={1.5}
                            fill={"#FFF"}
                            color="#FFF"
                        />

                        <NativeText
                            style={{
                                color: "#FFF",
                                fontFamily: "semibold",
                                fontSize: 15,
                                lineHeight: 18,
                            }}
                            numberOfLines={1}
                        >
                            {category}
                        </NativeText>
                    </View>
                </LinearGradient>
            );
        } else if (homework.returnType) {
            return (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: theme.colors.text + "11",
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                    }}
                >
                    <NativeText
                        variant="subtitle"
                        style={{ opacity: 0.8 }}
                        numberOfLines={1}
                    >
                        {homework.returnType === HomeworkReturnType.FileUpload
                            ? "À rendre sur l'ENT"
                            : homework.returnType === HomeworkReturnType.Paper
                            ? "À rendre en classe"
                            : null}
                    </NativeText>
                </View>
            );
        }
        return null;
    };

    return (
        <NativeItem
            animated
            onPress={() =>
                navigation.navigate("HomeworksDocument", { homework })
            }
            chevron={false}
            key={homework.content}
            entering={FadeIn}
            exiting={FadeOut}
            separator={index !== total - 1}
            style={{
                backgroundColor: category
                    ? subjectData.color + "15"
                    : undefined,
            }}
            leading={
                <Reanimated.View
                    layout={animPapillon(LinearTransition)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <PapillonCheckbox
                        checked={homework.done}
                        loading={isLoading}
                        onPress={handlePress}
                        style={{ marginRight: 1 }}
                        color={subjectData.color}
                        loaded={mainLoaded}
                    />
                </Reanimated.View>
            }
        >
            <Reanimated.View
                layout={animPapillon(LinearTransition)}
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Reanimated.View
                    style={{ flex: 1, gap: 4 }}
                    layout={animPapillon(LinearTransition)}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <NativeText
                            variant="overtitle"
                            style={{ color: subjectData.color, flex: 1 }}
                            numberOfLines={1}
                        >
                            {subjectData.pretty}
                        </NativeText>
                        {renderCategoryOrReturnType()}
                    </View>
                    <Reanimated.View
                        layout={animPapillon(LinearTransition)}
                        key={homework.content}
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200).delay(50)}
                    >
                        <HTMLView
                            value={`<body>${content}</body>`}
                            stylesheet={stylesText}
                        />
                        {route.name === "HomeScreen" && (
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    gap: 4,
                                    paddingBottom: 4,
                                    paddingTop: 8,
                                    alignItems: "center",
                                    alignSelf: "flex-start",
                                }}
                            >
                                <Clock
                                    size={18}
                                    strokeWidth={2.5}
                                    opacity={0.6}
                                    color={theme.colors.text}
                                />
                                <NativeText
                                    style={{
                                        color: theme.colors.text,
                                        opacity: 0.5,
                                    }}
                                >
                                    {timestampToString(homework.due)}
                                </NativeText>
                            </View>
                        )}
                    </Reanimated.View>
                    {homework.attachments.length > 0 && (
                        <Reanimated.View
                            layout={animPapillon(LinearTransition)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 4,
                                borderWidth: 1,
                                alignSelf: "flex-start",
                                borderColor: theme.colors.text + "33",
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 9,
                                borderCurve: "continuous",
                                marginRight: 16,
                            }}
                        >
                            {homework.attachments.length > 1 ? (
                                <Paperclip
                                    size={20}
                                    strokeWidth={2.5}
                                    color={theme.colors.text + "80"}
                                />
                            ) : homework.attachments[0].type == "file" ? (
                                <AutoFileIcon
                                    size={20}
                                    strokeWidth={2.5}
                                    color={theme.colors.text}
                                    opacity={0.7}
                                    filename={homework.attachments[0].name}
                                />
                            ) : (
                                <LinkFavicon
                                    size={20}
                                    url={homework.attachments[0].url}
                                />
                            )}
                            <NativeText
                                variant="subtitle"
                                numberOfLines={1}
                            >
                                {homework.attachments.length > 1
                                    ? `${homework.attachments.length} pièces jointes`
                                    : homework.attachments[0].name ||
                                      getURLDomain(
                                          homework.attachments[0].url,
                                          true
                                      )}
                            </NativeText>
                        </Reanimated.View>
                    )}
                </Reanimated.View>
            </Reanimated.View>
        </NativeItem>
    );
};

export default HomeworkItem;
