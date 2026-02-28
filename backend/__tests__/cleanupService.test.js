/**
 * Tests pour le service de nettoyage
 */

const { CleanupService, startCleanupService } = require("../services/cleanupService");

// Mock des modeles
jest.mock("../models", () => ({
  Message: {
    findExpiredImages: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// Mock du socket service
jest.mock("../services/socketService", () => ({
  SocketService: {
    emitToRoom: jest.fn(),
  },
}));

const { Message } = require("../models");

describe("CleanupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    CleanupService.stop();
    jest.useRealTimers();
  });

  describe("cleanupExpiredImages", () => {
    it("devrait retourner 0 si aucune image expiree", async () => {
      Message.findExpiredImages.mockResolvedValue([]);

      const result = await CleanupService.cleanupExpiredImages();

      expect(result).toBe(0);
      expect(Message.findExpiredImages).toHaveBeenCalled();
    });

    it("devrait supprimer les images expirees de la base de donnees", async () => {
      const mockExpiredMessages = [
        { id: 1, senderId: 1, receiverId: 2, destroy: jest.fn().mockResolvedValue(true) },
        { id: 2, senderId: 3, receiverId: 4, destroy: jest.fn().mockResolvedValue(true) },
      ];
      Message.findExpiredImages.mockResolvedValue(mockExpiredMessages);

      const result = await CleanupService.cleanupExpiredImages();

      expect(result).toBe(2);
      expect(mockExpiredMessages[0].destroy).toHaveBeenCalled();
      expect(mockExpiredMessages[1].destroy).toHaveBeenCalled();
    });

    it("devrait gerer les erreurs", async () => {
      Message.findExpiredImages.mockRejectedValue(new Error("Database error"));

      const result = await CleanupService.cleanupExpiredImages();

      expect(result).toBe(0);
    });
  });

  describe("cleanupImage", () => {
    it("devrait nettoyer une image specifique", async () => {
      const mockMessage = {
        id: 1,
        messageType: "image",
        expireImage: jest.fn().mockResolvedValue(true),
      };
      Message.findByPk.mockResolvedValue(mockMessage);

      const result = await CleanupService.cleanupImage(1);

      expect(result).toBe(true);
      expect(mockMessage.expireImage).toHaveBeenCalled();
    });

    it("devrait retourner false si le message n existe pas", async () => {
      Message.findByPk.mockResolvedValue(null);

      const result = await CleanupService.cleanupImage(999);

      expect(result).toBe(false);
    });

    it("devrait retourner false si ce n est pas une image", async () => {
      const mockMessage = {
        id: 1,
        messageType: "text",
      };
      Message.findByPk.mockResolvedValue(mockMessage);

      const result = await CleanupService.cleanupImage(1);

      expect(result).toBe(false);
    });

    it("devrait gerer les erreurs", async () => {
      Message.findByPk.mockRejectedValue(new Error("Database error"));

      const result = await CleanupService.cleanupImage(1);

      expect(result).toBe(false);
    });
  });

  describe("start et stop", () => {
    it("devrait demarrer le service", () => {
      Message.findExpiredImages.mockResolvedValue([]);

      CleanupService.start();

      expect(CleanupService.intervalId).toBeDefined();
    });

    it("devrait arreter le service", () => {
      Message.findExpiredImages.mockResolvedValue([]);
      CleanupService.start();

      CleanupService.stop();

      expect(CleanupService.intervalId).toBeNull();
    });

    it("devrait executer le nettoyage immediatement au demarrage", () => {
      Message.findExpiredImages.mockResolvedValue([]);

      CleanupService.start();

      expect(Message.findExpiredImages).toHaveBeenCalled();
    });
  });

  describe("startCleanupService", () => {
    it("devrait etre une fonction", () => {
      expect(typeof startCleanupService).toBe("function");
    });
  });
});
