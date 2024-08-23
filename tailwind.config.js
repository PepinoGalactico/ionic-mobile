const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    colors: {
      'mainblue': '#3139FB',
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      blue: colors.blue,
      cyan: colors.cyan,
      emerald: colors.emerald,
      fuchsia: colors.fuchsia,
      slate: colors.slate,
      gray: colors.gray,
      neutral: colors.neutral,
      stone: colors.stone,
      green: colors.green,
      indigo: colors.indigo,
      lime: colors.lime,
      orange: colors.orange,
      pink: colors.pink,
      purple: colors.purple,
      red: colors.red,
      rose: colors.rose,
      sky: colors.sky,
      teal: colors.teal,
      violet: colors.violet,
      yellow: colors.amber,
      white: colors.white,
    },
    fontFamily: {
      'display': ['Vanilla'],
      'body': ['Inter'],
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    require('flowbite/plugin')
  ],
};
