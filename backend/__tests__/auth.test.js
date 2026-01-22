/**
 * ============================================
 * AUTH CONTROLLER TESTS
 * ============================================
 *
 * Tests unitaires pour le contrôleur d'authentification
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Mock du modèle User
jest.mock("../models", () => ({
  User: {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    findByPseudo: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock de la config JWT
jest.mock("../config/jwt", () => ({
  secret: "test-secret-key",
  expiresIn: "1h",
}));

const AuthController = require("../controllers/authController");
const { User } = require("../models");
const { HTTP_STATUS, USER_STATUS } = require("../utils/constants");

describe("AuthController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset tous les mocks
    jest.clearAllMocks();

    // Mock de la requête
    mockReq = {
      body: {},
      user: {},
      file: null,
    };

    // Mock de la réponse
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock de next
    mockNext = jest.fn();
  });

  describe("login", () => {
    const validPassword = "TestPassword123!";
    const hashedPassword = bcrypt.hashSync(validPassword, 10);

    const mockUser = {
      id: 1,
      email: "test@example.com",
      pseudo: "testuser",
      password: hashedPassword,
      role: "user",
      statut: USER_STATUS.APPROVED,
      comparePassword: jest.fn(),
      toPublicJSON: jest.fn().mockReturnValue({
        id: 1,
        email: "test@example.com",
        pseudo: "testuser",
        role: "user",
      }),
    };

    it("devrait retourner 401 si l'utilisateur n'existe pas", async () => {
      mockReq.body = { email: "notfound@example.com", password: "password" };
      User.findOne.mockResolvedValue(null);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("devrait retourner 401 si le mot de passe est incorrect", async () => {
      mockReq.body = { email: "test@example.com", password: "wrongpassword" };
      mockUser.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
    });

    it("devrait retourner 403 si le compte est en attente", async () => {
      mockReq.body = { email: "test@example.com", password: validPassword };
      const pendingUser = {
        ...mockUser,
        statut: USER_STATUS.PENDING,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(pendingUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ statut: USER_STATUS.PENDING })
      );
    });

    it("devrait retourner 403 si le compte est rejeté", async () => {
      mockReq.body = { email: "test@example.com", password: validPassword };
      const rejectedUser = {
        ...mockUser,
        statut: USER_STATUS.REJECTED,
        raisonRejet: "Profil incomplet",
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(rejectedUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ statut: USER_STATUS.REJECTED })
      );
    });

    it("devrait retourner un token JWT si les credentials sont valides", async () => {
      mockReq.body = { email: "test@example.com", password: validPassword };
      mockUser.comparePassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.any(Object),
        })
      );
    });

    it("devrait appeler next() en cas d'erreur", async () => {
      mockReq.body = { email: "test@example.com", password: "password" };
      const error = new Error("Database error");
      User.findOne.mockRejectedValue(error);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("register", () => {
    const validRegistration = {
      nom: "Test User",
      pseudo: "newuser",
      email: "new@example.com",
      password: "SecurePass123!",
      dateNaissance: "1990-01-01",
      ville: "Paris",
      bio: "Test bio",
    };

    it("devrait retourner 409 si l'email existe déjà", async () => {
      mockReq.body = validRegistration;
      User.findByEmail.mockResolvedValue({ id: 1, email: validRegistration.email });

      await AuthController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    });

    it("devrait retourner 409 si le pseudo existe déjà", async () => {
      mockReq.body = validRegistration;
      User.findByEmail.mockResolvedValue(null);
      User.findByPseudo.mockResolvedValue({ id: 1, pseudo: validRegistration.pseudo });

      await AuthController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    });

    it("devrait créer un utilisateur avec statut pending", async () => {
      mockReq.body = validRegistration;
      User.findByEmail.mockResolvedValue(null);
      User.findByPseudo.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 1,
        ...validRegistration,
        statut: USER_STATUS.PENDING,
      });

      await AuthController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          needsApproval: true,
        })
      );
    });
  });

  describe("verifyToken", () => {
    it("devrait retourner 404 si l'utilisateur n'existe plus", async () => {
      mockReq.user = { userId: 999 };
      User.findByPk.mockResolvedValue(null);

      await AuthController.verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it("devrait retourner 403 si le profil n'est pas approuvé", async () => {
      mockReq.user = { userId: 1 };
      User.findByPk.mockResolvedValue({
        id: 1,
        statut: USER_STATUS.PENDING,
        isApproved: () => false,
      });

      await AuthController.verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    });

    it("devrait retourner les infos utilisateur si le token est valide", async () => {
      mockReq.user = { userId: 1 };
      const mockUserData = {
        id: 1,
        email: "test@example.com",
        pseudo: "testuser",
        role: "user",
      };
      User.findByPk.mockResolvedValue({
        id: 1,
        statut: USER_STATUS.APPROVED,
        isApproved: () => true,
        toPublicJSON: () => mockUserData,
      });

      await AuthController.verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: mockUserData,
        })
      );
    });
  });

  describe("checkStatus", () => {
    it("devrait retourner 404 si l'email n'existe pas", async () => {
      mockReq.body = { email: "notfound@example.com" };
      User.findByEmail.mockResolvedValue(null);

      await AuthController.checkStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it("devrait retourner le statut du profil", async () => {
      mockReq.body = { email: "test@example.com" };
      User.findByEmail.mockResolvedValue({
        statut: USER_STATUS.APPROVED,
        pseudo: "testuser",
        email: "test@example.com",
        dateValidation: new Date(),
      });

      await AuthController.checkStatus(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statut: USER_STATUS.APPROVED,
        })
      );
    });
  });
});
