var path = require('path');
var pathToPhaser = path.join(__dirname, '/node_modules/phaser/');
var phaser = path.join(pathToPhaser, 'dist/phaser.js');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        bundle: './client-src/client.ts',
        // version: './src/version.js',
    },
    output: {
        path: path.resolve(__dirname, 'client-dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' },
            { test: /phaser\.js$/, loader: 'expose-loader?Phaser' },
            {
                test: /\.json$/,
                loader: 'json-loader',
                // exclude: '/node_modules/',
                include: path.resolve('.')
            },
            {
                test: /\.ya?ml$/,
                include: path.resolve('.'),
                loader: 'yaml-loader',
            }
        ],
    },
    devServer: {
        contentBase: path.resolve(__dirname, '.'), // serves files not built from webpack
        publicPath: '/client-dist/', // webpack builds files into RAM, and serves in this path (overrides actual folders)
        host: '127.0.0.1',
        port: 8080,
        open: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            phaser: phaser
        }
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // ecma: undefined,
                    // warnings: false,
                    // parse: {},
                    // compress: {},
                    mangle: true, // Note `mangle.properties` is `false` by default.
                    // module: false,
                    // output: null,
                    // toplevel: false,
                    // nameCache: null,
                    // ie8: false,
                    // keep_classnames: undefined,
                    // keep_fnames: false,
                    // safari10: false,
                },
            }),
        ],
        usedExports: true,
    },
    plugins: [
        // new CopyPlugin([
        //     { from: '*.html', context: 'client-src/' },
        //     { from: '**/*.css', context: 'client-src/' },
        // ])
    ]
};
