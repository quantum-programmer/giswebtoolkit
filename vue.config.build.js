const path = require('path');
const svgSpriteConfig = require('./webpack-configs/svg-sprite-config');
const CopyPlugin = require('copy-webpack-plugin');
const OUTPUT_PATH = path.resolve(__dirname, 'release');

module.exports = {
    transpileDependencies: ['vuetify'],
    productionSourceMap: false,
    outputDir: 'release/gwtkse',
    publicPath: '',
    chainWebpack: config => {
        config.plugin('VuetifyLoaderPlugin');
        svgSpriteConfig(config);
    },
    configureWebpack: {
        entry: path.resolve(__dirname, 'example', 'main.ts'),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, 'src'),
                "~": path.resolve(__dirname, 'GIS WebToolKit SE/debug/source'),
            },
            extensions: ['.ts', '.js', '.vue', '.json']
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    {
                        from: '**/*',
                        context: path.resolve(__dirname, 'public', 'gwtkse'),
                        to: path.resolve(OUTPUT_PATH, 'gwtkse'),
                        force: true,
                    },
                    {
                        from: '**/*',
                        context: path.resolve(__dirname, 'public', 'locale'),
                        to: path.resolve(OUTPUT_PATH, 'locale'),
                        force: true,
                    },

                    {
                        from: '**/*',
                        context: path.resolve(__dirname, 'public', 'jquery'),
                        to: path.resolve(OUTPUT_PATH, 'jquery'),
                        force: true,
                    },
                    {
                        from: '**/*',
                        context: path.resolve(__dirname, 'public', 'w2ui'),
                        to: path.resolve(OUTPUT_PATH, 'w2ui'),
                        force: true,
                    },

                    {
                        from: '*.css',
                        context: path.resolve(__dirname, 'public'),
                        to: OUTPUT_PATH,
                        force: true,
                    },
                    {
                        from: '*.js',
                        context: path.resolve(__dirname, 'public'),
                        to: OUTPUT_PATH,
                        force: true,
                    },
                    {
                        from: 'web-ifc.wasm',
                        context: path.resolve(__dirname, 'node_modules', 'web-ifc'),
                        to: path.resolve(OUTPUT_PATH, 'gwtkse', 'wasm'),
                        force: true,
                    },

                ]
            }),
        ],
        module:{
          rules:[
              {
                  test: /\.(woff|woff2|eot|ttf|otf)$/i,
                  type: "asset/resource",
                  generator: {
                      filename: "gwtkse/fonts/[name].[hash:8].[ext]",
                  },
              },
          ]
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
