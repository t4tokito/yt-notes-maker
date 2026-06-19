const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WebAssembly (wa-sqlite) build — let Metro bundle .wasm.
config.resolver.assetExts.push("wasm");

// wa-sqlite needs SharedArrayBuffer, which requires these COOP/COEP headers
// to be sent by the dev server.
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./global.css" });
