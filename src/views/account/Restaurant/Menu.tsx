import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import {
  X,
  Clock2,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wallet,
} from "lucide-react-native";

import type { Screen } from "@/router/helpers/types";
import RestaurantCard from "@/components/Restaurant/RestaurantCard";
import { HorizontalList, Item } from "@/components/Restaurant/ButtonList";
import {
  NativeItem,
  NativeList,
  NativeListHeader,
  NativeText,
} from "@/components/Global/NativeComponents";
import { useCurrentAccount } from "@/stores/account";
import { AccountService, ExternalAccount } from "@/stores/account/types";
import TabAnimatedTitle from "@/components/Global/TabAnimatedTitle";
import { Balance } from "@/services/shared/Balance";
import { balanceFromExternal } from "@/services/balance";
import MissingItem from "@/components/Global/MissingItem";
import { animPapillon } from "@/utils/ui/animations";
import Reanimated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { reservationHistoryFromExternal } from "@/services/reservation-history";
import { qrcodeFromExternal } from "@/services/qrcode";
import { ReservationHistory } from "@/services/shared/ReservationHistory";
import { getMenu } from "@/services/menu";
import type { Menu as PawnoteMenu } from "pawnote";
import { PapillonHeaderSelector } from "@/components/Global/PapillonModernHeader";
import AnimatedNumber from "@/components/Global/AnimatedNumber";
import { LessonsDateModal } from "../Lessons/LessonsHeader";

const Menu: Screen<"Menu"> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const account = useCurrentAccount(store => store.account);
  const linkedAccounts = useCurrentAccount(store => store.linkedAccounts);
  const screenWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  const handleScroll = (event: { nativeEvent: { contentOffset: { x: any; }; }; }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffsetX / (screenWidth - 200));
    setActiveIndex(Math.max(0, Math.min(index, balances ? balances.length - 1 : 0)));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      ...TabAnimatedTitle({ theme, route, navigation }),
    });
  }, [navigation, route.params, theme.colors.text]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [history, setHistory] = useState<ReservationHistory[] | null>(null);
  const [qrcode, setQRCodes] = useState<number[] | null>(null);
  const [menu, setMenu] = useState<PawnoteMenu | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = React.useState(new Date(today));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    void async function () {
      const balances: Balance[] = [];
      const histories: ReservationHistory[] = [];
      const qrcodes: number[] = [];
      let dailyMenu: PawnoteMenu | null = null;
      if (account) {
        dailyMenu = await getMenu(account, pickerDate);
      }
      for (const account of linkedAccounts) {
        try {
          const balance = await balanceFromExternal(account);
          const history = await reservationHistoryFromExternal(account);
          const cardnumber = await qrcodeFromExternal(account);
          balances.push(...balance);
          histories.push(...history);
          cardnumber !== 0 && qrcodes.push(cardnumber);
        } catch (error) {
          console.warn("Failed to fetch balance or history for account", account);
        }
      }

      setBalances(balances);
      setHistory(histories);
      setQRCodes(qrcodes);
      setMenu(dailyMenu);
    }();
  }, [linkedAccounts]);

  const updateMenu = async (date: Date) => {
    setLoading(true);
    let dailyMenu: PawnoteMenu | null = null;
    if (account) {
      dailyMenu = await getMenu(account, date);
    }
    setMenu(dailyMenu);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      {balances?.length === 0 ? (
        <MissingItem
          emoji="🤔"
          title="Vous n'avez lié aucun compte"
          description="Pour accéder à la cantine, vous devez lier un compte dans l'onglet services externes."
          entering={animPapillon(FadeInDown)}
          exiting={animPapillon(FadeOut)}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={screenWidth}
          onScroll={handleScroll}
          decelerationRate="fast"
          scrollEnabled={(balances ?? []).length > 1}
          contentContainerStyle={{ alignItems: "center", gap: 16 }}
        >
          {balances?.map((item, index) => (
            <View style={{ width: screenWidth - 32 }}>
              <RestaurantCard
                solde={item.amount}
                repas={item.remaining}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {balances && balances.length > 1 && (
        <View style={styles.dotsContainer}>
          {balances.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? { backgroundColor: colors.text } : { backgroundColor: colors.text + "25" },
              ]}
            />
          ))}
        </View>
      )}

      <HorizontalList style={styles.horizontalList}>
        <Item
          title="Historique"
          icon={<Clock2 color={colors.text} />}
          onPress={() => navigation.navigate("RestaurantHistory", { histories: history ?? [] })}
          enable={history?.length !== 0}
        />
        <Item
          title="QR-Code"
          icon={<QrCode color={colors.text} />}
          onPress={() => navigation.navigate("RestaurantQrCode", { QrCodes: qrcode ?? [] })}
          enable={balances?.length !== 0}
        />
      </HorizontalList>
      <View style={styles.calendarContainer}>
        <PapillonHeaderSelector
          loading={loading}
          onPress={() => setShowDatePicker(true)}
        >
          <Reanimated.View
            layout={animPapillon(LinearTransition)}
          >
            <Reanimated.View
              key={pickerDate.toLocaleDateString("fr-FR", { weekday: "short" })}
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
            >
              <Reanimated.Text style={[styles.weekPickerText, styles.weekPickerTextIntl,
                {
                  color: theme.colors.text,
                }
              ]}
              >
                {pickerDate.toLocaleDateString("fr-FR", { weekday: "long" })}
              </Reanimated.Text>
            </Reanimated.View>
          </Reanimated.View>


          <AnimatedNumber
            value={pickerDate.getDate().toString()}
            style={[styles.weekPickerText, styles.weekPickerTextNbr,
              {
                color: theme.colors.text,
              }
            ]}
          />

          <Reanimated.Text style={[styles.weekPickerText, styles.weekPickerTextIntl,
            {
              color: theme.colors.text,
            }
          ]}
          layout={animPapillon(LinearTransition)}
          >
            {pickerDate.toLocaleDateString("fr-FR", { month: "long" })}
          </Reanimated.Text>
        </PapillonHeaderSelector>
      </View>
      {!loading && menu?.lunch ? (
        <>
          <NativeListHeader label="Menus du jour" />
          <NativeList>
            {menu.lunch.entry && (
              <NativeItem>
                <NativeText variant="subtitle">Entrée</NativeText>
                {menu.lunch.entry.map((food, index) => (
                  <NativeText key={index} variant="title">{food.name}</NativeText>
                ))}
              </NativeItem>
            )}
            {menu.lunch.main && (
              <NativeItem>
                <NativeText variant="subtitle">Plat</NativeText>
                {menu.lunch.main.map((food, index) => (
                  <NativeText key={index} variant="title">{food.name}</NativeText>
                ))}
              </NativeItem>
            )}
            {menu.lunch.fromage && (
              <NativeItem>
                <NativeText variant="subtitle">Fromage</NativeText>
                {menu.lunch.fromage.map((food, index) => (
                  <NativeText key={index} variant="title">{food.name}</NativeText>
                ))}
              </NativeItem>
            )}
            {menu.lunch.dessert && (
              <NativeItem>
                <NativeText variant="subtitle">Dessert</NativeText>
                {menu.lunch.dessert.map((food, index) => (
                  <NativeText key={index} variant="title">{food.name}</NativeText>
                ))}
              </NativeItem>
            )}
            {menu.lunch.drink && (
              <NativeItem>
                <NativeText variant="subtitle">Boisson</NativeText>
                {menu.lunch.drink.map((food, index) => (
                  <NativeText key={index} variant="title">{food.name}</NativeText>
                ))}
              </NativeItem>
            )}
          </NativeList>
        </>
      ) : !loading ? (
        <MissingItem
          emoji="❌"
          title="Aucun menu prévu"
          description={`Malheureusement, aucun menu n'est prévu pour le ${pickerDate.toLocaleDateString("fr-FR", { weekday: "long", month: "long", day: "numeric" })}.`}
          entering={animPapillon(FadeInDown)}
          exiting={animPapillon(FadeOut)}
          style={{ marginTop: 16 }}
        />
      ) : null}

      <LessonsDateModal
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        currentDate={pickerDate}
        onDateSelect={(date: Date) => {
          const newDate = new Date(date);
          newDate.setHours(0, 0, 0, 0);
          setPickerDate(newDate);
          updateMenu(newDate);
          setShowDatePicker(false);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  lottieIcon: {
    width: 26,
    height: 26,
  },
  headerTitleText: {
    fontFamily: "semibold",
    fontSize: 17.5,
  },
  headerRightButton: {
    padding: 6,
    borderRadius: 18,
    opacity: 0.6,
  },
  scrollViewContent: {
    padding: 16,
    gap: 16,
  },
  horizontalList: {
    marginTop: 10,
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: -10,
    gap: 10,
  },
  calendarButton: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  calendarTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
  },
  calendarText: {
    fontFamily: "semibold",
    fontSize: 17,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  weekPickerText: {
    zIndex: 10000,
  },

  weekPickerTextIntl: {
    fontSize: 14.5,
    fontFamily: "medium",
    opacity: 0.7,
  },

  weekPickerTextNbr: {
    fontSize: 16.5,
    fontFamily: "semibold",
    marginTop: -1.5,
  },
});

export default Menu;
