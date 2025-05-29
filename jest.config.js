module.exports = {
    // preset: 'ts-jest',
    preset: '@vue/cli-plugin-unit-jest',
    transformIgnorePatterns: [
        "node_modules/(?!(vuetify|roboto-fontface|@mdi|spin.js|jquery|vue-draggable-resizable)/)",
    ],
    verbose: true,
    collectCoverage: true,
    // collectCoverageFrom: [
    //     '**/*.{ts,vue}',
    //     '!**/node_modules/**',
    //     '!**/vendor/**'
    // ],
    // coverageReporters: [
    //     'json', 'lcov', 'text'
    // ],
    moduleFileExtensions: [
        'js',
        'jsx',
        'json',
        'vue',
        'ts',
        'tsx'
    ],
    transform: {
        "^.+\\.js$": "babel-jest",
        '^.+\\.vue$': 'vue-jest',
        '^.+\\.tsx?$': 'ts-jest',
        '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub'
    },
    moduleNameMapper: {
        '^@/plugins/(.*)$': '<rootDir>/src/plugins/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/GIS WebToolKit SE/debug/source/$1',
        
    },
    //  snapshotSerializers: [
    //     'jest-serializer-vue'
    // ],
    testMatch: [
        '**/*.spec.(js|ts|tsx)'
    ],
    testURL: 'http://localhost:8080/'
};
