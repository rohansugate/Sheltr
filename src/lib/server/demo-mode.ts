export function isDemoBypassEnabled() {
  return (
    process.env.ALLOW_DEMO_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_ALLOW_DEMO_BYPASS === "true"
  );
}
