import MissingItem from "@/components/Global/MissingItem";
import { NativeText } from "@/components/Global/NativeComponents";
import { reservationHistoryFromExternal } from "@/services/reservation-history";
import { ReservationHistory } from "@/services/shared/ReservationHistory";
import { useAccounts, useCurrentAccount } from "@/stores/account";
import type { ExternalAccount } from "@/stores/account/types";
import { animPapillon } from "@/utils/ui/animations";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { FadeInDown, FadeOut } from "react-native-reanimated";

const RestaurantHistory = ({ route }) => {
  const accounts = useAccounts((state) => state.accounts);
  const account = useCurrentAccount(store => store.account);

  const linkedAccounts = useMemo(() => {
    return account?.linkedExternalLocalIDs.map((linkedID) => {
      return accounts.find((acc) => acc.localID === linkedID);
    }).filter(Boolean) as ExternalAccount[] ?? [];
  }, [account?.linkedExternalLocalIDs, accounts]);

  const histories = route.params?.histories ?? [];

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      {histories === null ? (
        <NativeText>Chargement...</NativeText>
      ) : histories.length === 0 ? (
        <MissingItem
          emoji="🧾"
          title="Aucune réservation"
          description="Effectuez une réservation pour la voir apparaître ici."
          entering={animPapillon(FadeInDown)}
          exiting={animPapillon(FadeOut)}
        />
      ) : (
        histories.map((reservation, index) => (
          <NativeText key={index}>{reservation.amount}{reservation.currency} le {new Date(reservation.timestamp).toLocaleString("fr-FR")}</NativeText>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
  },
});

export default RestaurantHistory;
