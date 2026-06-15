module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@theme': './src/theme',
            '@services': './src/services',
            '@context': './src/context',
            '@hooks': './src/hooks',
            '@screens': './src/screens',
            '@modals': './src/modals',
            '@components': './src/components',
          },
        },
      ],
    ],
  };
};
