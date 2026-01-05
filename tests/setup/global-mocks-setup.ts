// Global mocks for all tests

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    captureEvent: jest.fn(),
    withScope: jest.fn((callback) => callback({})),
    configureScope: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn()
})); 