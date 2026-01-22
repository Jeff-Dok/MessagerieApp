/**
 * ============================================
 * TEST SETUP - Configuration des tests Jest
 * ============================================
 */

// Mock des variables d'environnement
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
process.env.JWT_EXPIRES_IN = "1h";

// Mock du logger pour éviter les logs pendant les tests
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  success: jest.fn(),
}));

// Timeout global pour les tests
jest.setTimeout(10000);
