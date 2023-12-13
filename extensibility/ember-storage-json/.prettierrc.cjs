'use strict';

module.exports = {
  plugins: ['prettier-plugin-ember-template-tag'],
  singleQuote: true,
  overrides: [
    {
      files: '*.{gjs,gts}',
      options: {
        parser: 'ember-template-tag',
      },
    },
  ],
};
