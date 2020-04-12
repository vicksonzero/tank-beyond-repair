module.exports = {
    mode: 'production',
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
                    sourceMap: true,
                    output: { comments: false },
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
};
