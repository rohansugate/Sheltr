import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function BrowseScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();

  if (!url || typeof url !== "string") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No URL provided.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Servers</Text>
        </Pressable>
        <Text style={styles.url} numberOfLines={1}>
          {url}
        </Text>
      </View>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        originWhitelist={["*"]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf9f7",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  link: {
    color: "#1a1a1a",
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    gap: 8,
  },
  back: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  url: {
    flex: 1,
    fontSize: 12,
    color: "#666",
  },
  webview: {
    flex: 1,
  },
});
