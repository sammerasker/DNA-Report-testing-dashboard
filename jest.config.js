/**
 * Jest Configuration for DNA Report App
 * Configured for ES modules with Next.js and React components
 */

const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'lib/**/*.js',
    'components/**/*.js',
    '!lib/**/*.test.js',
    '!lib/**/*.spec.js',
    '!components/**/*.test.js',
    '!components/**/*.spec.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  injectGlobals: true,
  verbose: true
};

export default config;
