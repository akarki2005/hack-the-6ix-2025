module.exports = {
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/tests/**/*.test.[jt]s?(x)",
    "<rootDir>/tests/**/*.spec.[jt]s?(x)",
  ],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/*.spec.{js,jsx,ts,tsx}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../src/$1",
  },

  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
};
