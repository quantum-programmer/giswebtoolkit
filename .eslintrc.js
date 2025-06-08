module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        'jest': true
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        'parser': '@typescript-eslint/parser',
        'sourceType': 'module',
        'ecmaVersion': 2018,
        'ecmaFeatures': {
            'globalReturn': false,
            'impliedStrict': false,
            'jsx': false
        }
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/recommended',
        'plugin:import/warnings',
    ],
    plugins: [
        'vue',
        'import'
    ],
    rules: {
        'no-case-declarations': 'off',
        'no-console': 'off',
        'no-debugger': 'off',
        'no-dupe-class-members': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'brace-style': [2, '1tbs', { 'allowSingleLine': true }],
        'import/namespace': ['error', { allowComputed: true }],
        'import/newline-after-import': ['error', { 'count': 1 }],
        'indent': ['error', 4, { 'SwitchCase': 1, 'ignoredNodes': ['PropertyDefinition'] }],
        'quotes': [2, 'single', { 'avoidEscape': true }],
        'semi': [
            'error',
            'always'
        ],
        'semi-spacing': [2, { 'before': false, 'after': true }],
        'strict': 'off',
        'space-before-blocks': [1, 'always'],
        'vue/html-indent': ['error', 4, {
            'attribute': 1,
            'closeBracket': 0,
            'alignAttributesVertically': true,
            'ignores': []
        }],
        'vue/max-attributes-per-line': 'off',
        'vue/no-use-v-if-with-v-for': ['error', {
            'allowUsingIterationVar': true
        }],
        'vue/script-indent': ['error', 4, { 'baseIndent': 1 }],
		'vue/valid-v-slot': ['error', {allowModifiers: true}]
    },
    overrides: [
        {
            'files': ['*.vue'],
            'rules': {
                'indent': 'off'
            }
        }
    ],
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.vue', '.ts']
            }
        },
    }
};
