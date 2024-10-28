import LoginView from "@/components/Templates/LoginView";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { getStudentData } from "@/services/iutlan/fetch_iutlan";

export const UnivIUTLannion_Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username, password) => {
    setLoading(true);
    const data = await getStudentData(username, password);

    console.log(data);

    if (data?.redirect == "/services/doAuth.php") {
      setError("Identifiants incorrects");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const loginViewProps = useMemo(() => ({
    serviceName: "IUT de Lannion",
    serviceIcon: require("@/../assets/images/service_iutlan.png"),
    onLogin: login,
    loading,
    error,
  }), [login]);

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <LoginView {...loginViewProps} />
    </View>
  );
};