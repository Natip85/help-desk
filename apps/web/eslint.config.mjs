import baseConfig, { restrictEnvAccess } from "@help-desk/eslint-config/base";
import nextjsConfig from "@help-desk/eslint-config/nextjs";
import reactConfig from "@help-desk/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
