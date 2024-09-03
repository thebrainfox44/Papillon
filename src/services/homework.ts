import { type Account, AccountService } from "@/stores/account/types";
import { useHomeworkStore } from "@/stores/homework";
import type { Homework } from "./shared/Homework";
import { error } from "@/utils/logger/logger";
import { translateToWeekNumber } from "pawnote";
import { pronoteFirstDate } from "./pronote/timetable";
import { dateToEpochWeekNumber, epochWNToPronoteWN } from "@/utils/epochWeekNumber";

/**
 * Updates the state and cache for the homework of given week number.
 */
export async function updateHomeworkForWeekInCache <T extends Account> (account: T, date: Date): Promise<void> {
  let homeworks: Homework[] = [];

  try {
    switch (account.service) {
      case AccountService.Pronote: {
        const { getHomeworkForWeek } = await import("./pronote/homework");
        const weekNumber = translateToWeekNumber(date, account.instance?.instance.firstDate || pronoteFirstDate);
        homeworks = await getHomeworkForWeek(account, weekNumber);
        break;
      }
      default:
        console.info(`[updateHomeworkForWeekInCache]: updating to empty since ${account.service} not implemented.`);
    }

    useHomeworkStore.getState().updateHomeworks(dateToEpochWeekNumber(date), homeworks);
  }
  catch (err) {
    error("not updated, see:" + err, "updateHomeworkForWeekInCache");
  }
}

export async function toggleHomeworkState <T extends Account> (account: T, homework: Homework): Promise<void> {
  switch (account.service) {
    case AccountService.Pronote: {
      const { toggleHomeworkState } = await import("./pronote/homework");
      await toggleHomeworkState(account, homework);
      break;
    }
    default: {
      throw new Error("Service not implemented");
    }
  }
}
