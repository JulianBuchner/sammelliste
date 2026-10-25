const { defineConfig } = require("@vue/cli-service");

// Local backend (server/index.ts, `npm run server`). In production the hub
// forwards /sammelliste/api/* to it with the prefix removed.
const API_TARGET = "http://127.0.0.1:3300";

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === "production" ? "/sammelliste/" : "/",
  devServer: {
    proxy: {
      "^/sammelliste/api/": {
        target: API_TARGET,
        pathRewrite: { "^/sammelliste/api": "" },
      },
      "^/api/": {
        target: API_TARGET,
        pathRewrite: { "^/api": "" },
      },
    },
  },
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
