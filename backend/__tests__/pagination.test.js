/**
 * Tests pour les utilitaires de pagination
 */

const {
  PAGINATION_DEFAULTS,
  parsePaginationParams,
  buildPaginatedResponse,
  paginationMiddleware,
  getSequelizePaginationOptions,
} = require("../utils/pagination");

describe("Pagination - Utilitaires de pagination", () => {
  describe("PAGINATION_DEFAULTS", () => {
    it("devrait avoir les valeurs par defaut", () => {
      expect(PAGINATION_DEFAULTS.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION_DEFAULTS.DEFAULT_LIMIT).toBe(50);
      expect(PAGINATION_DEFAULTS.MAX_LIMIT).toBe(100);
      expect(PAGINATION_DEFAULTS.MIN_LIMIT).toBe(1);
    });
  });

  describe("parsePaginationParams", () => {
    it("devrait utiliser les valeurs par defaut si aucun parametre", () => {
      const result = parsePaginationParams({});
      expect(result).toEqual({
        page: 1,
        limit: 50,
        offset: 0,
      });
    });

    it("devrait parser la page correctement", () => {
      const result = parsePaginationParams({ page: "3" });
      expect(result.page).toBe(3);
      expect(result.offset).toBe(100); // (3-1) * 50
    });

    it("devrait parser la limite correctement", () => {
      const result = parsePaginationParams({ limit: "25" });
      expect(result.limit).toBe(25);
    });

    it("devrait limiter la page minimum a 1", () => {
      const result = parsePaginationParams({ page: "-5" });
      expect(result.page).toBe(1);
    });

    it("devrait limiter la page minimum a 1 pour valeur invalide", () => {
      const result = parsePaginationParams({ page: "abc" });
      expect(result.page).toBe(1);
    });

    it("devrait limiter la limite au maximum configure", () => {
      const result = parsePaginationParams({ limit: "500" });
      expect(result.limit).toBe(100);
    });

    it("devrait utiliser la limite par defaut si limit est 0 (falsy)", () => {
      const result = parsePaginationParams({ limit: "0" });
      expect(result.limit).toBe(50); // 0 est falsy donc defaultLimit s'applique
    });

    it("devrait limiter la limite au minimum de 1 pour valeurs negatives", () => {
      const result = parsePaginationParams({ limit: "-5" });
      expect(result.limit).toBe(1);
    });

    it("devrait calculer l offset correctement", () => {
      const result = parsePaginationParams({ page: "5", limit: "10" });
      expect(result.offset).toBe(40); // (5-1) * 10
    });

    it("devrait accepter des options personnalisees", () => {
      const result = parsePaginationParams(
        { limit: "200" },
        { defaultLimit: 30, maxLimit: 150 }
      );
      expect(result.limit).toBe(150);
    });

    it("devrait utiliser defaultLimit personnalise", () => {
      const result = parsePaginationParams({}, { defaultLimit: 25 });
      expect(result.limit).toBe(25);
    });
  });

  describe("buildPaginatedResponse", () => {
    it("devrait construire une reponse paginee", () => {
      const result = buildPaginatedResponse({
        data: [1, 2, 3],
        total: 100,
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it("devrait calculer totalPages correctement", () => {
      const result = buildPaginatedResponse({
        data: [],
        total: 25,
        page: 1,
        limit: 10,
      });
      expect(result.pagination.totalPages).toBe(3);
    });

    it("devrait indiquer hasNextPage false sur la derniere page", () => {
      const result = buildPaginatedResponse({
        data: [],
        total: 30,
        page: 3,
        limit: 10,
      });
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("devrait indiquer hasPrevPage true apres la premiere page", () => {
      const result = buildPaginatedResponse({
        data: [],
        total: 30,
        page: 2,
        limit: 10,
      });
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it("devrait gerer le cas ou total est 0", () => {
      const result = buildPaginatedResponse({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });

  describe("paginationMiddleware", () => {
    it("devrait ajouter req.pagination", () => {
      const middleware = paginationMiddleware();
      const req = { query: { page: "2", limit: "20" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.pagination).toEqual({
        page: 2,
        limit: 20,
        offset: 20,
      });
      expect(next).toHaveBeenCalled();
    });

    it("devrait accepter des options personnalisees", () => {
      const middleware = paginationMiddleware({ defaultLimit: 15, maxLimit: 50 });
      const req = { query: {} };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.pagination.limit).toBe(15);
      expect(next).toHaveBeenCalled();
    });

    it("devrait respecter maxLimit dans les options", () => {
      const middleware = paginationMiddleware({ maxLimit: 25 });
      const req = { query: { limit: "100" } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.pagination.limit).toBe(25);
    });
  });

  describe("getSequelizePaginationOptions", () => {
    it("devrait retourner les options Sequelize", () => {
      const pagination = { page: 2, limit: 20, offset: 20 };
      const result = getSequelizePaginationOptions(pagination);

      expect(result).toEqual({
        limit: 20,
        offset: 20,
      });
    });

    it("devrait ne pas inclure page dans le resultat", () => {
      const pagination = { page: 5, limit: 10, offset: 40 };
      const result = getSequelizePaginationOptions(pagination);

      expect(result.page).toBeUndefined();
    });
  });
});
