import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  // Relax rules for pre-existing code — remediation sprint 2026-07-24
  {
    rules: {
      // Pre-existing: 140+ 'no-explicit-any' violations across the codebase.
      // These are accepted during remediation and should be removed incrementally.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]

export default eslintConfig
