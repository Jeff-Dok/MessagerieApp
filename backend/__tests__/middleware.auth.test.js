/**
 * ============================================
 * AUTH MIDDLEWARE TESTS
 * ============================================
 *
 * Tests unitaires pour le middleware d'authentification
 */

const jwt = require("jsonwebtoken");

// Mock de la config JWT
jest.mock("../config/jwt", () => ({
  secret: "test-secret-key",
  expiresIn: "1h",
}));

const { authenticate, isAdmin, optionalAuth } = require("../middleware/auth");
const { HTTP_STATUS, USER_ROLES } = require("../utils/constants");
const jwtConfig = require("../config/jwt");

describe("Auth Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("authenticate", () => {
    it("devrait retourner 401 si aucun header Authorization", () => {
      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("devrait retourner 401 si le header ne commence pas par Bearer", () => {
      mockReq.headers.authorization = "Basic sometoken";

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("devrait retourner 401 si le token est invalide", () => {
      mockReq.headers.authorization = "Bearer invalid-token";

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "TOKEN_INVALID" })
      );
    });

    it("devrait retourner 401 si le token est expiré", () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: "test@test.com", role: "user" },
        jwtConfig.secret,
        { expiresIn: "-1s" }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "TOKEN_EXPIRED" })
      );
    });

    it("devrait appeler next() et ajouter user à req si token valide", () => {
      const validToken = jwt.sign(
        { userId: 1, email: "test@test.com", role: "user" },
        jwtConfig.secret,
        { expiresIn: "1h" }
      );
      mockReq.headers.authorization = `Bearer ${validToken}`;

      authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        userId: 1,
        email: "test@test.com",
        role: "user",
      });
    });
  });

  describe("isAdmin", () => {
    it("devrait retourner 401 si req.user est undefined", () => {
      mockReq.user = undefined;

      isAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("devrait retourner 403 si l'utilisateur n'est pas admin", () => {
      mockReq.user = { userId: 1, role: "user" };

      isAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("devrait appeler next() si l'utilisateur est admin", () => {
      mockReq.user = { userId: 1, role: USER_ROLES.ADMIN };

      isAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("devrait définir req.user à null si aucun header Authorization", () => {
      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it("devrait définir req.user à null si le header ne commence pas par Bearer", () => {
      mockReq.headers.authorization = "Basic sometoken";

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it("devrait définir req.user à null si le token est invalide", () => {
      mockReq.headers.authorization = "Bearer invalid-token";

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it("devrait ajouter user à req si token valide", () => {
      const validToken = jwt.sign(
        { userId: 1, email: "test@test.com", role: "user" },
        jwtConfig.secret,
        { expiresIn: "1h" }
      );
      mockReq.headers.authorization = `Bearer ${validToken}`;

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        userId: 1,
        email: "test@test.com",
        role: "user",
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
