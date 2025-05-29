const path = require('path');
const svgSpriteConfig = require('./webpack-configs/svg-sprite-config');

module.exports = {
    runtimeCompiler: true,
    transpileDependencies: ['vuetify'],
    productionSourceMap: false,
    outputDir: 'release',
    chainWebpack: config => {
        config.plugin('VuetifyLoaderPlugin');
        svgSpriteConfig(config);
    },
    configureWebpack: {
        entry: path.resolve(__dirname, 'example', 'main.ts'),
        // devtool:'inline-source-map', // раскомментировать для отладки второго потока
        resolve: {
            alias: {
                "@": path.resolve(__dirname, 'src'),
                "~": path.resolve(__dirname, 'GIS WebToolKit SE/debug/source'),
            },
            extensions: ['.ts', '.js', '.vue', '.json']
        },
        output: {
            libraryExport: 'default'
        }
    },
    pluginOptions: {
        svgSprite: {
            // The directory containing your SVG files.
            dir: 'src/components/System/Vuetify/assets/icons',
            test: /\.(svg)(\?.*)?$/,
            // @see https://github.com/kisenka/svg-sprite-loader#configuration
            loaderOptions: {
                extract: true,
                spriteFilename: 'svg-sprite.svg'
            },
            pluginOptions: {
                plainSprite: true
            }
        }
    }
};
