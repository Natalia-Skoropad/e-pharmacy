import tseslint from 'typescript-eslint';

//===============================================================

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@e-pharmacy/*', '**/packages/**'],
              message:
                'apps/api must remain independent from frontend workspace packages.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);
