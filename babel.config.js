module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'tslib': './node_modules/tslib/tslib.js',
          },
        },
      ],
    ],
  };
};
