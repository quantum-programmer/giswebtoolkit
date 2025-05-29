const path = require('path');
const svgSpriteConfig = require('./webpack-configs/svg-sprite-config');
const CopyPlugin = require('copy-webpack-plugin');
const OUTPUT_PATH = path.resolve(__dirname, 'release');

module.exports = {
    transpileDependencies: ['vuetify'],
    productionSourceMap: false,
    outputDir: 'release',
    chainWebpack: config => {
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
                    //для GwtkHome - картинки лежат в компоненте
                    // {
                    //     from: '*.png',
                    //     context: path.resolve(OUTPUT_PATH, 'img'),
                    //     to: path.resolve(OUTPUT_PATH, 'css', 'img'),
                    //     force: true,
                    // },

                ]
            })
        ],
    }
};
