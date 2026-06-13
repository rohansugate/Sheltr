import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { getRecentUrl, normalizeUrl, saveRecentUrl } from "@/lib/storage";

const DEFAULT_HINT = "http://192.168.1.38:3000";

export default function HomeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [recent, setRecent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentUrl().then((saved) => {
      if (saved) {
        setRecent(saved);
        setUrl(saved);
      } else {
        const extra = Constants.expoConfig?.extra?.doorwayUrl as string | undefined;
        if (extra && extra !== "http://localhost:3000") {
          setUrl(extra);
        }
      }
      setLoading(false);
    });
  }, []);

  const connect = useCallback(
    async (raw?: string) => {
      const normalized = normalizeUrl(raw ?? url);
      if (!normalized) return;
      await saveRecentUrl(normalized);
      router.push({ pathname: "/browse", params: { url: normalized } });
    },
    [url, router],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Doorway</Text>
        <Text style={styles.subtitle}>Development Build</Text>
      </View>

      <Text style={styles.sectionLabel}>DEVELOPMENT SERVER</Text>

      <Text style={styles.hint}>
        Start the Next.js app on your Mac, then enter its URL (same Wi‑Fi as your phone).
      </Text>

      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder={DEFAULT_HINT}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        onSubmitEditing={() => connect()}
      />

      <Pressable style={styles.button} onPress={() => connect()}>
        <Text style={styles.buttonText}>Connect</Text>
      </Pressable>

      {recent ? (
        <View style={styles.recentBlock}>
          <Text style={styles.sectionLabel}>RECENTLY OPENED</Text>
          <Pressable style={styles.recentRow} onPress={() => connect(recent)}>
            <View style={styles.dot} />
            <View>
              <Text style={styles.recentTitle}>Doorway</Text>
              <Text style={styles.recentUrl}>{recent}</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.footer}>
        Mac: cd doorway && npm run dev -- --hostname 0.0.0.0{"\n"}
        Use your Mac's IP, port 3000
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#888",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  recentBlock: {
    marginTop: 28,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  recentUrl: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  footer: {
    marginTop: "auto",
    marginBottom: 40,
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
  },
});
