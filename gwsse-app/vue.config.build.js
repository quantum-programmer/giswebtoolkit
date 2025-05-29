const path = require('path');
const svgSpriteConfig = require('../webpack-configs/svg-sprite-config');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    runtimeCompiler: true,
    transpileDependencies: ['vuetify'],
    productionSourceMap: false,
    outputDir: 'release/',
    publicPath: '',
    chainWebpack: config => {
        config.plugin('VuetifyLoaderPlugin');
        svgSpriteConfig(config);
    },
    configureWebpack: {
        entry: path.resolve(__dirname, 'initApp.ts'),
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '..', 'src'),
                '~': path.resolve(__dirname, '..', 'GIS WebToolKit SE/debug/source'),
            },
            extensions: ['.ts', '.js', '.vue', '.json']
        },
        module: {
            rules: [
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'gwtkse/fonts/[name].[hash:8].[ext]',
                    },
                },
            ]
        },
        plugins: [
            new CopyPlugin({
                patterns: [{
                    from: 'web-ifc.wasm',
                    context: path.resolve(__dirname, '..', 'node_modules', 'web-ifc'),
                    to: 'gwtkse/wasm/',
                    force: true,
                },
                ]
            }),
        ]
    },
    pluginOptions: {
        svgSprite: {
            // The directory containing your SVG files.
            dir: path.resolve(__dirname, '..', 'src/components/System/Vuetify/assets/icons'),
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
