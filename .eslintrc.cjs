module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [    'plugin:vue/vue3-recommended', 'eslint:recommended', '@vue/typescript/recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        'vue/component-tags-order': [
            'error',
            {
                order: ['script', 'template', 'style'],
            },
        ],
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'vue/no-deprecated-slot-attribute': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
    },
}
