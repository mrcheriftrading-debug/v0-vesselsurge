import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const generatedIgnores = [
  '.next/**',
  'node_modules/**',
  'out/**',
  'next-env.d.ts',
]

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: generatedIgnores,
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-anonymous-default-export': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/jsx-no-comment-textnodes': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]

export default config
