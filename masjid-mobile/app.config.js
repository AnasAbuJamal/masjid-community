// Refuse internal phone previews pointing at localhost, HTTP, or an unconfigured API.
// EXPO_PUBLIC_API_URL is embedded in the phone binary; never put secrets there.
module.exports = ({config}) => {
  if (process.env.EAS_BUILD_PROFILE === "preview") {
    const raw = (process.env.EXPO_PUBLIC_API_URL || "").trim();
    let target;
    try { target = new URL(raw); } catch { /* Rejected below. */ }
    if (!target || target.protocol !== "https:" || target.username || target.password ||
        target.search || target.hash || target.pathname !== "/" ||
        ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
      throw new Error("Preview builds require EXPO_PUBLIC_API_URL set to the root HTTPS staging API origin.");
    }
  }
  return config;
};
