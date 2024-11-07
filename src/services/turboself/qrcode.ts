import type { TurboselfAccount } from "@/stores/account/types";

export const getQRCode = async (account: TurboselfAccount): Promise<string> => {
  const cardNumber = await account.authentication.session.host?.cardNumber;
  return cardNumber?.toString() ?? "0";
};
