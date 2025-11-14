/*
 * Copyright contributors to the Galasa project
 *
 * SPDX-License-Identifier: EPL-2.0
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// The Jest configuration to use in this project - see https://jestjs.io/docs/configuration for more information
const config = {
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  testEnvironment: "./extendedJsdomEnvironment.ts",

  // Ignore auto-generated code in coverage reports
  coveragePathIgnorePatterns: [
    "<rootDir>/src/generated/"
  ],

  // Map module path aliases (i.e. imports starting with '@', like '@/my/ts/file' ) to absolute paths
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1"
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next-intl))', 
    '^.+\\.module\\.(css|sass|scss)$'
  ],

  // Required for testing the image renderer
  setupFiles: ['jest-canvas-mock'],

};

module.exports = createJestConfig(config);
