const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
require("typescript");

const OUTPUT_PATH = path.resolve(__dirname, 'release');

module.exports = {
    mode: 'production',
    entry: './GIS WebToolKit SE/debug/source/index',
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
            ]
        }),
        new VueLoaderPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: [
                    {
                        loader: 'worker-loader',
                    },
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'src/'),
            '~': path.resolve(__dirname, 'GIS WebToolKit SE/debug/source/')
        }
    },
    output: {
        filename: 'gwtkse.js',
        path: OUTPUT_PATH,
        library: 'GWTKSE_PRO',
        libraryTarget: 'umd',
        // publicPath: './gwtkse/'
    },
    externals: {
        jquery: 'jQuery'
    }
};