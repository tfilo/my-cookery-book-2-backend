import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['node_modules', 'dist', 'src/tests/openapi', 'src/tests/openapi-internal']
    },
    eslint.configs.recommended,
    tseslint.configs.recommended
);
