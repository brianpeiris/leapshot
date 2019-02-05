module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    node: true
  },
  plugins: ["prettier"],
  "extends": ["prettier", "eslint:recommended"]
};
