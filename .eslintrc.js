module.exports = {
  root: true,
  extends: 'airbnb-es5',
  env: {
    'browser': true
  },
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-console': 0,
    'quote-props': 0,
    'func-names': 0,
    'comma-dangle': 0
  }
};
