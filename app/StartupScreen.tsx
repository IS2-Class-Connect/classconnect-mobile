import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

export default function StartupScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/HomeScreen"); 
      } else {
        router.replace("/LoginScreen");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
