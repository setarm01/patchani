import antfu from "@antfu/eslint-config";

export default antfu({
  typescript: true,
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "ts/no-explicit-any": "off",
    "prefer-template": "off",
    "perfectionist/sort-named-imports": "off",
    "antfu/if-newline": "off",
    "antfu/consistent-list-newline": "off",
    "style/brace-style": "off",
    "regexp/negation": "off",
    "style/semi": "off",
    "style/quotes": "off",
    "style/member-delimiter-style": "off",
    "style/comma-dangle": "off",
    "style/no-trailing-spaces": "off",
    "style/padded-blocks": "off",
    "style/operator-linebreak": "off",
    "unused-imports/no-unused-vars": "off"
  }
});
