module.exports = {
  "presets": [
    "@vue/cli-plugin-babel/preset"
  ],
    overrides: [{
        test: "node_modules/vuetify/dist/vuetify.js",
        compact: true,
    }],
    ignore: [
        "GIS WebToolKit SE/debug/source/3d/engine/worker/workerscripts"
    ]
}