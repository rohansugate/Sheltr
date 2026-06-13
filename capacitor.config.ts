import type { CapacitorConfig } from "@capacitor/cli";

// Point the native shell at your Next.js server (local Mac IP or Vercel URL).
// Example: CAPACITOR_SERVER_URL=http://192.168.1.42:3000 npx cap sync ios
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.doorway.app",
  appName: "Doorway",
  webDir: "public",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        androidScheme: "https",
        allowNavigation: ["*"],
      }
    : undefined,
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  },
};

export default config;
