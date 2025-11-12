const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        background: './src/background/index.js',
        content: './src/content/index.js',
        popup: './src/popup/controller.js',
        options: './src/options/controller.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    plugins: [
        new Dotenv()
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    mode: 'development',
    devtool: 'cheap-module-source-map'
};