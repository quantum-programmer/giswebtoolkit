const svgoPlugins = require('./svgo-plugins');

module.exports = config => {
    config.module
        .rule('svg-sprite')
        .use('svgo-loader')
        .loader('svgo-loader')
        .options(svgoPlugins)
        .end();
};
