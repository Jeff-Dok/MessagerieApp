/**
 * Tests pour le contrôleur utilisateurs
 */

const UserController = require("../controllers/userController");
const { HTTP_STATUS, SERVER_MESSAGES } = require("../utils/constants");

// Mock des modeles
jest.mock("../models", () => ({
  User: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findByEmail: jest.fn(),
  },
  Message: {
    count: jest.fn(),
    countUnreadForUser: jest.fn(),
  },
}));

const { User, Message } = require("../models");

describe("UserController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { userId: 1, role: "user" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("devrait retourner la liste des utilisateurs", async () => {
      const mockUsers = [
        { id: 1, nom: "User 1", email: "user1@test.com" },
        { id: 2, nom: "User 2", email: "user2@test.com" },
      ];
      User.findAndCountAll.mockResolvedValue({ count: 2, rows: mockUsers });

      await UserController.getAllUsers(mockReq, mockRes, mockNext);

      expect(User.findAndCountAll).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        totalPages: 1,
        currentPage: 1,
        users: mockUsers,
      });
    });

    it("devrait supporter la pagination", async () => {
      mockReq.query = { page: "2", limit: "10" };
      User.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });

      await UserController.getAllUsers(mockReq, mockRes, mockNext);

      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPages: 3,
          currentPage: 2,
        })
      );
    });

    it("devrait gerer les erreurs", async () => {
      const error = new Error("Database error");
      User.findAndCountAll.mockRejectedValue(error);

      await UserController.getAllUsers(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getUserById", () => {
    it("devrait retourner un utilisateur par ID", async () => {
      const mockUser = { id: 1, nom: "Test User", email: "test@test.com" };
      mockReq.params.id = "1";
      User.findByPk.mockResolvedValue(mockUser);

      await UserController.getUserById(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith("1", expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: mockUser,
      });
    });

    it("devrait retourner 404 si utilisateur non trouve", async () => {
      mockReq.params.id = "999";
      User.findByPk.mockResolvedValue(null);

      await UserController.getUserById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.NOT_FOUND,
      });
    });

    it("devrait gerer les erreurs", async () => {
      mockReq.params.id = "1";
      const error = new Error("Database error");
      User.findByPk.mockRejectedValue(error);

      await UserController.getUserById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateUser", () => {
    it("devrait mettre a jour un utilisateur", async () => {
      mockReq.params.id = "1";
      mockReq.body = { nom: "Updated Name", email: "updated@test.com" };
      mockReq.user = { userId: 1, role: "user" };

      const mockUser = {
        id: 1,
        nom: "Old Name",
        email: "old@test.com",
        update: jest.fn().mockResolvedValue(true),
        toPublicJSON: jest.fn().mockReturnValue({
          id: 1,
          nom: "Updated Name",
          email: "updated@test.com",
        }),
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findByEmail.mockResolvedValue(null);

      await UserController.updateUser(mockReq, mockRes, mockNext);

      expect(mockUser.update).toHaveBeenCalledWith({
        nom: "Updated Name",
        email: "updated@test.com",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: SERVER_MESSAGES.USER.UPDATED,
        user: expect.any(Object),
      });
    });

    it("devrait refuser si l utilisateur n a pas les permissions", async () => {
      mockReq.params.id = "2";
      mockReq.user = { userId: 1, role: "user" };

      await UserController.updateUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.ACCESS_DENIED,
      });
    });

    it("devrait permettre a un admin de modifier n importe quel utilisateur", async () => {
      mockReq.params.id = "2";
      mockReq.body = { nom: "Admin Update" };
      mockReq.user = { userId: 1, role: "admin" };

      const mockUser = {
        id: 2,
        email: "user@test.com",
        update: jest.fn().mockResolvedValue(true),
        toPublicJSON: jest.fn().mockReturnValue({ id: 2, nom: "Admin Update" }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await UserController.updateUser(mockReq, mockRes, mockNext);

      expect(mockUser.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("devrait refuser si l email est deja utilise", async () => {
      mockReq.params.id = "1";
      mockReq.body = { email: "existing@test.com" };
      mockReq.user = { userId: 1, role: "user" };

      const mockUser = { id: 1, email: "old@test.com" };
      const existingUser = { id: 2, email: "existing@test.com" };
      User.findByPk.mockResolvedValue(mockUser);
      User.findByEmail.mockResolvedValue(existingUser);

      await UserController.updateUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.AUTH.EMAIL_EXISTS,
      });
    });

    it("devrait retourner 404 si utilisateur non trouve", async () => {
      mockReq.params.id = "1";
      mockReq.user = { userId: 1, role: "user" };
      User.findByPk.mockResolvedValue(null);

      await UserController.updateUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("deleteUser", () => {
    it("devrait permettre a un admin de supprimer un utilisateur", async () => {
      mockReq.params.id = "2";
      mockReq.user = { userId: 1, role: "admin" };

      const mockUser = {
        id: 2,
        destroy: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await UserController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: SERVER_MESSAGES.USER.DELETED,
      });
    });

    it("devrait refuser si l utilisateur n est pas admin", async () => {
      mockReq.params.id = "2";
      mockReq.user = { userId: 1, role: "user" };

      await UserController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.ACCESS_DENIED,
      });
    });

    it("devrait empecher un admin de supprimer son propre compte", async () => {
      mockReq.params.id = "1";
      mockReq.user = { userId: 1, role: "admin" };

      const mockUser = { id: 1 };
      User.findByPk.mockResolvedValue(mockUser);

      await UserController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    });

    it("devrait retourner 404 si utilisateur non trouve", async () => {
      mockReq.params.id = "999";
      mockReq.user = { userId: 1, role: "admin" };
      User.findByPk.mockResolvedValue(null);

      await UserController.deleteUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("getUserStats", () => {
    it("devrait retourner les statistiques d un utilisateur", async () => {
      mockReq.params.id = "1";
      mockReq.user = { userId: 1, role: "user" };

      Message.count
        .mockResolvedValueOnce(10) // messagesSent
        .mockResolvedValueOnce(15); // messagesReceived
      Message.countUnreadForUser.mockResolvedValue(3);

      await UserController.getUserStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        stats: {
          messagesSent: 10,
          messagesReceived: 15,
          unreadCount: 3,
          totalMessages: 25,
        },
      });
    });

    it("devrait refuser si l utilisateur n a pas les permissions", async () => {
      mockReq.params.id = "2";
      mockReq.user = { userId: 1, role: "user" };

      await UserController.getUserStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
    });

    it("devrait permettre a un admin de voir les stats de n importe qui", async () => {
      mockReq.params.id = "2";
      mockReq.user = { userId: 1, role: "admin" };

      Message.count.mockResolvedValue(5);
      Message.countUnreadForUser.mockResolvedValue(0);

      await UserController.getUserStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
