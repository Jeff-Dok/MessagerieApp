/**
 * Tests pour le gestionnaire d'erreurs
 */

const errorHandler = require("../middleware/errorHandler");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { HTTP_STATUS } = require("../utils/constants");

describe("ErrorHandler", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      originalUrl: "/test",
      method: "POST",
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("errorHandler middleware", () => {
    it("devrait gerer une erreur SequelizeValidationError", () => {
      const err = {
        name: "SequelizeValidationError",
        errors: [
          { path: "email", message: "Email invalide", type: "validation" },
        ],
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Erreur de validation",
        errors: [{ field: "email", message: "Email invalide", type: "validation" }],
      });
    });

    it("devrait gerer une erreur SequelizeUniqueConstraintError", () => {
      const err = {
        name: "SequelizeUniqueConstraintError",
        errors: [{ path: "email", message: "Email existe deja" }],
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Cette valeur existe déjà",
        errors: [{ field: "email", message: "Email existe deja" }],
      });
    });

    it("devrait gerer une erreur SequelizeDatabaseError", () => {
      const err = {
        name: "SequelizeDatabaseError",
        message: "Database connection failed",
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Erreur de base de données",
        })
      );
    });

    it("devrait gerer une erreur SequelizeForeignKeyConstraintError", () => {
      const err = {
        name: "SequelizeForeignKeyConstraintError",
      };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Référence invalide",
        detail: "L'entité référencée n'existe pas",
      });
    });

    it("devrait gerer une erreur JsonWebTokenError", () => {
      const err = { name: "JsonWebTokenError" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token invalide",
        code: "TOKEN_INVALID",
      });
    });

    it("devrait gerer une erreur TokenExpiredError", () => {
      const err = { name: "TokenExpiredError" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expiré",
        code: "TOKEN_EXPIRED",
      });
    });

    it("devrait gerer une erreur MulterError LIMIT_FILE_SIZE", () => {
      const err = { name: "MulterError", code: "LIMIT_FILE_SIZE" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Fichier trop volumineux",
        maxSize: "5MB",
      });
    });

    it("devrait gerer une erreur MulterError LIMIT_UNEXPECTED_FILE", () => {
      const err = { name: "MulterError", code: "LIMIT_UNEXPECTED_FILE" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Champ de fichier inattendu",
        expectedField: "image",
      });
    });

    it("devrait gerer une erreur MulterError autre", () => {
      const err = { name: "MulterError", code: "OTHER", message: "Other error" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Erreur lors de l'upload",
        detail: "Other error",
      });
    });

    it("devrait gerer une erreur SyntaxError JSON", () => {
      const err = new SyntaxError("Unexpected token");
      err.status = 400;
      err.body = {};

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "JSON invalide dans la requête",
      });
    });

    it("devrait gerer une erreur CastError", () => {
      const err = { name: "CastError", path: "id" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Format de données invalide",
        field: "id",
      });
    });

    it("devrait gerer une erreur avec statusCode personnalise", () => {
      const err = { statusCode: 403, message: "Forbidden" };

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Forbidden",
        })
      );
    });

    it("devrait gerer une erreur generique", () => {
      const err = new Error("Something went wrong");

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
        })
      );
    });
  });

  describe("asyncHandler", () => {
    it("devrait wrapper une fonction async", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      const wrapped = asyncHandler(fn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it("devrait passer les erreurs a next", async () => {
      const error = new Error("Async error");
      const fn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(fn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("AppError", () => {
    it("devrait creer une erreur avec message et statusCode", () => {
      const error = new AppError("Custom error", 400);

      expect(error.message).toBe("Custom error");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it("devrait utiliser 500 par defaut", () => {
      const error = new AppError("Server error");

      expect(error.statusCode).toBe(500);
    });

    it("devrait etre une instance d Error", () => {
      const error = new AppError("Test");

      expect(error).toBeInstanceOf(Error);
    });
  });
});
