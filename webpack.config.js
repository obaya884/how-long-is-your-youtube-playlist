const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        content: './src/content/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'styles.css', to: 'styles.css' },
                { from: 'icons', to: 'icons' },
                { from: '_locales', to: '_locales' }
            ]
        })
    ],
    optimization: {
        minimize: true
    },
    devtool: false
};
