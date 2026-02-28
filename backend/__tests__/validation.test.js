/**
 * Tests pour le middleware de validation
 */

const { sanitizeInput } = require("../middleware/validation");

describe("Validation Middleware", () => {
  describe("sanitizeInput", () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    it("devrait appeler next()", () => {
      sanitizeInput(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it("devrait trim les chaines dans body", () => {
      mockReq.body = {
        nom: "  Jean  ",
        email: "  test@example.com  ",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.nom).toBe("Jean");
      expect(mockReq.body.email).toBe("test@example.com");
    });

    it("devrait trim les chaines dans query", () => {
      mockReq.query = {
        search: "  terme  ",
        page: "  1  ",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.query.search).toBe("terme");
      expect(mockReq.query.page).toBe("1");
    });

    it("devrait supprimer les caracteres de controle", () => {
      mockReq.body = {
        text: "Hello\x00World\x1F",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.text).toBe("HelloWorld");
    });

    it("devrait garder les newlines dans le body", () => {
      mockReq.body = {
        bio: "Ligne 1\nLigne 2",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.bio).toBe("Ligne 1\nLigne 2");
    });

    it("devrait ignorer les valeurs non-string", () => {
      mockReq.body = {
        count: 42,
        active: true,
        data: null,
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.count).toBe(42);
      expect(mockReq.body.active).toBe(true);
      expect(mockReq.body.data).toBe(null);
    });

    it("devrait gerer un body vide", () => {
      mockReq.body = {};
      mockReq.query = {};

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("devrait gerer un body undefined", () => {
      mockReq.body = undefined;
      mockReq.query = undefined;

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
