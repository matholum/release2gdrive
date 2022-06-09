module.exports = {
    testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
    moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
    coverageReporters: ['cobertura'],
    collectCoverage: true,
    transform: {
      '^.+\\.(ts|js|html)$': 'ts-jest',
    },
    testEnvironment: 'jsdom'
  }
