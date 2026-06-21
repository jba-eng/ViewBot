module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.{js,ts,cjs}'],
  moduleFileExtensions: ['js', 'ts', 'cjs', 'json', 'node'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'CommonJS',
        target: 'ES2020',
        strict: false
      }
    }],
    '^.+\\.cjs$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'CommonJS',
        target: 'ES2020',
        strict: false
      }
    }]
  },
  moduleNameMapper: {
    '^rumble-core$': '<rootDir>/node_modules/rumble-core',
    '^youtube-selfbot-api$': '<rootDir>/node_modules/youtube-selfbot-api'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'main/server/**/*.cjs',
    'main/src/**/*.ts'
  ],
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
