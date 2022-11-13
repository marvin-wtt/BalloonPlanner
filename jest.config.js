module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },

  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
