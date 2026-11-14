const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        content: './src/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'styles.css', to: 'styles.css' },
                { from: 'icons', to: 'icons', globOptions: { ignore: ['**/.DS_Store'] } },
                { from: '_locales', to: '_locales', globOptions: { ignore: ['**/.DS_Store'] } }
            ]
        })
    ],
    optimization: {
        minimize: true
    },
    devtool: false
};
