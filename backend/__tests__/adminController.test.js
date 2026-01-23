/**
 * Tests pour le contrôleur admin
 */

const AdminController = require("../controllers/adminController");
const { HTTP_STATUS, SERVER_MESSAGES, USER_STATUS } = require("../utils/constants");

// Mock des modeles
jest.mock("../models", () => ({
  User: {
    findPendingProfiles: jest.fn(),
    countPending: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// Mock du socket service
jest.mock("../services/socketService", () => ({
  SocketService: {
    emitToUser: jest.fn(),
  },
}));

const { User } = require("../models");
const { SocketService } = require("../services/socketService");

describe("AdminController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { userId: 1, role: "admin" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getPendingProfiles", () => {
    it("devrait retourner les profils en attente", async () => {
      const mockPendingUsers = [
        { id: 2, nom: "User 2", statut: USER_STATUS.PENDING, toAdminJSON: () => ({ id: 2, nom: "User 2" }) },
        { id: 3, nom: "User 3", statut: USER_STATUS.PENDING, toAdminJSON: () => ({ id: 3, nom: "User 3" }) },
      ];

      User.findPendingProfiles.mockResolvedValue(mockPendingUsers);

      await AdminController.getPendingProfiles(mockReq, mockRes, mockNext);

      expect(User.findPendingProfiles).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        profiles: expect.any(Array),
      });
    });

    it("devrait gerer les erreurs", async () => {
      const error = new Error("Database error");
      User.findPendingProfiles.mockRejectedValue(error);

      await AdminController.getPendingProfiles(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPendingCount", () => {
    it("devrait retourner le nombre de profils en attente", async () => {
      User.countPending.mockResolvedValue(5);

      await AdminController.getPendingCount(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 5,
      });
    });

    it("devrait gerer les erreurs", async () => {
      const error = new Error("Database error");
      User.countPending.mockRejectedValue(error);

      await AdminController.getPendingCount(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getProfileDetails", () => {
    it("devrait retourner les details d un profil", async () => {
      mockReq.params.id = "2";

      const mockUser = {
        id: 2,
        nom: "Test User",
        toAdminJSON: () => ({ id: 2, nom: "Test User", email: "test@test.com" }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await AdminController.getProfileDetails(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith("2");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        profile: expect.any(Object),
      });
    });

    it("devrait retourner 404 si l utilisateur n existe pas", async () => {
      mockReq.params.id = "999";
      User.findByPk.mockResolvedValue(null);

      await AdminController.getProfileDetails(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.NOT_FOUND,
      });
    });

    it("devrait gerer les erreurs", async () => {
      mockReq.params.id = "2";
      const error = new Error("Database error");
      User.findByPk.mockRejectedValue(error);

      await AdminController.getProfileDetails(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("approveProfile", () => {
    it("devrait approuver un profil en attente", async () => {
      mockReq.params.id = "2";

      const mockUser = {
        id: 2,
        statut: USER_STATUS.PENDING,
        update: jest.fn().mockResolvedValue(true),
        toPublicJSON: jest.fn().mockReturnValue({ id: 2, statut: USER_STATUS.APPROVED }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await AdminController.approveProfile(mockReq, mockRes, mockNext);

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: USER_STATUS.APPROVED,
        })
      );
      expect(SocketService.emitToUser).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: SERVER_MESSAGES.USER.PROFILE_APPROVED,
        })
      );
    });

    it("devrait retourner 404 si l utilisateur n existe pas", async () => {
      mockReq.params.id = "999";
      User.findByPk.mockResolvedValue(null);

      await AdminController.approveProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it("devrait refuser si le profil n est pas en attente", async () => {
      mockReq.params.id = "2";

      const mockUser = {
        id: 2,
        statut: USER_STATUS.APPROVED,
      };
      User.findByPk.mockResolvedValue(mockUser);

      await AdminController.approveProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("rejectProfile", () => {
    it("devrait rejeter un profil avec une raison", async () => {
      mockReq.params.id = "2";
      mockReq.body = { reason: "Profil incomplet" };

      const mockUser = {
        id: 2,
        statut: USER_STATUS.PENDING,
        update: jest.fn().mockResolvedValue(true),
        toPublicJSON: jest.fn().mockReturnValue({ id: 2, statut: USER_STATUS.REJECTED }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await AdminController.rejectProfile(mockReq, mockRes, mockNext);

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: USER_STATUS.REJECTED,
          rejectionReason: "Profil incomplet",
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: SERVER_MESSAGES.USER.PROFILE_REJECTED,
        })
      );
    });

    it("devrait exiger une raison de rejet", async () => {
      mockReq.params.id = "2";
      mockReq.body = {};

      await AdminController.rejectProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.ADMIN.VALIDATION_REQUIRED,
      });
    });

    it("devrait retourner 404 si l utilisateur n existe pas", async () => {
      mockReq.params.id = "999";
      mockReq.body = { reason: "Test" };
      User.findByPk.mockResolvedValue(null);

      await AdminController.rejectProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it("devrait refuser si le profil n est pas en attente", async () => {
      mockReq.params.id = "2";
      mockReq.body = { reason: "Test" };

      const mockUser = {
        id: 2,
        statut: USER_STATUS.APPROVED,
      };
      User.findByPk.mockResolvedValue(mockUser);

      await AdminController.rejectProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
