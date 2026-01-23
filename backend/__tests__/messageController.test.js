/**
 * Tests pour le contrôleur messages
 */

const MessageController = require("../controllers/messageController");
const { HTTP_STATUS, SERVER_MESSAGES } = require("../utils/constants");

// Mock des services
jest.mock("../services/socketService", () => ({
  SocketService: {
    emitToRoom: jest.fn(),
    emitToUser: jest.fn(),
  },
}));

jest.mock("../services/imageService", () => ({
  validateImage: jest.fn(),
  processImage: jest.fn(),
}));

// Mock des modeles
jest.mock("../models", () => ({
  Message: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findConversation: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
}));

const { Message, User } = require("../models");
const ImageService = require("../services/imageService");
const { SocketService } = require("../services/socketService");

describe("MessageController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { userId: 1, role: "user" },
      file: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("devrait envoyer un message texte avec succes", async () => {
      mockReq.body = { receiverId: 2, content: "Hello!" };

      const mockReceiver = { id: 2, nom: "User 2" };
      const mockMessage = {
        id: 1,
        senderId: 1,
        receiverId: 2,
        content: "Hello!",
        messageType: "text",
      };

      User.findByPk.mockResolvedValue(mockReceiver);
      Message.create.mockResolvedValue(mockMessage);
      Message.findByPk.mockResolvedValue({
        ...mockMessage,
        sender: { id: 1, nom: "User 1" },
        receiver: mockReceiver,
      });

      await MessageController.sendMessage(mockReq, mockRes, mockNext);

      expect(Message.create).toHaveBeenCalledWith({
        senderId: 1,
        receiverId: 2,
        content: "Hello!",
        messageType: "text",
        read: false,
      });
      expect(SocketService.emitToRoom).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: SERVER_MESSAGES.MESSAGE.SENT,
        })
      );
    });

    it("devrait retourner 404 si le destinataire n existe pas", async () => {
      mockReq.body = { receiverId: 999, content: "Hello!" };
      User.findByPk.mockResolvedValue(null);

      await MessageController.sendMessage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.NOT_FOUND,
      });
    });

    it("devrait gerer les erreurs", async () => {
      mockReq.body = { receiverId: 2, content: "Hello!" };
      const error = new Error("Database error");
      User.findByPk.mockRejectedValue(error);

      await MessageController.sendMessage(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("sendImage", () => {
    it("devrait retourner une erreur si aucun fichier n est fourni", async () => {
      mockReq.body = { receiverId: 2 };
      mockReq.file = null;

      await MessageController.sendImage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.IMAGE.NO_FILE,
      });
    });

    it("devrait retourner une erreur si l image est invalide", async () => {
      mockReq.body = { receiverId: 2 };
      mockReq.file = { buffer: Buffer.from("test"), mimetype: "image/jpeg" };

      ImageService.validateImage.mockReturnValue({
        valid: false,
        error: "Invalid image",
      });

      await MessageController.sendImage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid image",
      });
    });

    it("devrait retourner 404 si le destinataire n existe pas", async () => {
      mockReq.body = { receiverId: 999 };
      mockReq.file = { buffer: Buffer.from("test"), mimetype: "image/jpeg" };

      ImageService.validateImage.mockReturnValue({ valid: true });
      User.findByPk.mockResolvedValue(null);

      await MessageController.sendImage(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: SERVER_MESSAGES.USER.NOT_FOUND,
      });
    });
  });
});
