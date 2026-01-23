/**
 * Tests pour les constantes de l'application
 */

const {
  USER_ROLES,
  USER_STATUS,
  MESSAGE_TYPES,
  IMAGE_STATUS,
  HTTP_STATUS,
  SERVER_MESSAGES,
  PAGINATION,
  IMAGE_CONFIG,
  PROFILE_PHOTO_CONFIG,
  BIO_CONFIG,
  PSEUDO_CONFIG,
  AGE_CONFIG,
  CLEANUP_CONFIG,
  SOCKET_EVENTS,
  REJECTION_REASONS,
} = require("../utils/constants");

describe("Constants - Constantes de l'application", () => {
  describe("USER_ROLES", () => {
    it("devrait avoir les roles ADMIN et USER", () => {
      expect(USER_ROLES.ADMIN).toBe("admin");
      expect(USER_ROLES.USER).toBe("user");
    });

    it("devrait avoir exactement 2 roles", () => {
      expect(Object.keys(USER_ROLES).length).toBe(2);
    });
  });

  describe("USER_STATUS", () => {
    it("devrait avoir tous les statuts requis", () => {
      expect(USER_STATUS.PENDING).toBe("pending");
      expect(USER_STATUS.APPROVED).toBe("approved");
      expect(USER_STATUS.REJECTED).toBe("rejected");
    });

    it("devrait avoir exactement 3 statuts", () => {
      expect(Object.keys(USER_STATUS).length).toBe(3);
    });
  });

  describe("MESSAGE_TYPES", () => {
    it("devrait avoir les types TEXT et IMAGE", () => {
      expect(MESSAGE_TYPES.TEXT).toBe("text");
      expect(MESSAGE_TYPES.IMAGE).toBe("image");
    });
  });

  describe("IMAGE_STATUS", () => {
    it("devrait avoir les statuts ACTIVE, VIEWED et EXPIRED", () => {
      expect(IMAGE_STATUS.ACTIVE).toBe("active");
      expect(IMAGE_STATUS.VIEWED).toBe("viewed");
      expect(IMAGE_STATUS.EXPIRED).toBe("expired");
    });
  });

  describe("HTTP_STATUS", () => {
    it("devrait avoir les codes HTTP standards", () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it("devrait avoir le code TOO_MANY_REQUESTS", () => {
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    });
  });

  describe("SERVER_MESSAGES", () => {
    it("devrait avoir des messages d authentification", () => {
      expect(SERVER_MESSAGES.AUTH).toBeDefined();
      expect(SERVER_MESSAGES.AUTH.LOGIN_SUCCESS).toBeDefined();
      expect(SERVER_MESSAGES.AUTH.LOGIN_FAILED).toBeDefined();
      expect(SERVER_MESSAGES.AUTH.REGISTER_SUCCESS).toBeDefined();
    });

    it("devrait avoir des messages utilisateur", () => {
      expect(SERVER_MESSAGES.USER).toBeDefined();
      expect(SERVER_MESSAGES.USER.NOT_FOUND).toBeDefined();
      expect(SERVER_MESSAGES.USER.UPDATED).toBeDefined();
    });

    it("devrait avoir des messages de message", () => {
      expect(SERVER_MESSAGES.MESSAGE).toBeDefined();
      expect(SERVER_MESSAGES.MESSAGE.SENT).toBeDefined();
      expect(SERVER_MESSAGES.MESSAGE.NOT_FOUND).toBeDefined();
    });

    it("devrait avoir des messages d image", () => {
      expect(SERVER_MESSAGES.IMAGE).toBeDefined();
      expect(SERVER_MESSAGES.IMAGE.EXPIRED).toBeDefined();
      expect(SERVER_MESSAGES.IMAGE.TOO_LARGE).toBeDefined();
    });

    it("devrait avoir des messages admin", () => {
      expect(SERVER_MESSAGES.ADMIN).toBeDefined();
      expect(SERVER_MESSAGES.ADMIN.CANNOT_DELETE_SELF).toBeDefined();
    });

    it("devrait avoir des messages d erreur", () => {
      expect(SERVER_MESSAGES.ERROR).toBeDefined();
      expect(SERVER_MESSAGES.ERROR.SERVER).toBeDefined();
    });
  });

  describe("PAGINATION", () => {
    it("devrait avoir des valeurs par defaut valides", () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });

    it("devrait avoir une limite max superieure a la limite par defaut", () => {
      expect(PAGINATION.MAX_LIMIT).toBeGreaterThan(PAGINATION.DEFAULT_LIMIT);
    });
  });

  describe("IMAGE_CONFIG", () => {
    it("devrait avoir une taille max", () => {
      expect(IMAGE_CONFIG.MAX_SIZE).toBeGreaterThan(0);
    });

    it("devrait avoir des types autorises", () => {
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain("image/jpeg");
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain("image/png");
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain("image/gif");
    });

    it("devrait avoir des extensions autorisees", () => {
      expect(IMAGE_CONFIG.ALLOWED_EXTENSIONS).toContain("jpg");
      expect(IMAGE_CONFIG.ALLOWED_EXTENSIONS).toContain("png");
    });

    it("devrait avoir des dimensions max", () => {
      expect(IMAGE_CONFIG.MAX_WIDTH).toBeGreaterThan(0);
      expect(IMAGE_CONFIG.MAX_HEIGHT).toBeGreaterThan(0);
    });

    it("devrait avoir une qualite entre 1 et 100", () => {
      expect(IMAGE_CONFIG.QUALITY).toBeGreaterThan(0);
      expect(IMAGE_CONFIG.QUALITY).toBeLessThanOrEqual(100);
    });

    it("devrait avoir un temps d expiration", () => {
      expect(IMAGE_CONFIG.EXPIRATION_TIME).toBeGreaterThan(0);
    });
  });

  describe("PROFILE_PHOTO_CONFIG", () => {
    it("devrait avoir une taille max", () => {
      expect(PROFILE_PHOTO_CONFIG.MAX_SIZE).toBeGreaterThan(0);
    });

    it("devrait avoir des types autorises", () => {
      expect(PROFILE_PHOTO_CONFIG.ALLOWED_TYPES.length).toBeGreaterThan(0);
    });

    it("devrait avoir des dimensions", () => {
      expect(PROFILE_PHOTO_CONFIG.MAX_WIDTH).toBeDefined();
      expect(PROFILE_PHOTO_CONFIG.MAX_HEIGHT).toBeDefined();
    });
  });

  describe("BIO_CONFIG", () => {
    it("devrait avoir une longueur min et max", () => {
      expect(BIO_CONFIG.MIN_LENGTH).toBeDefined();
      expect(BIO_CONFIG.MAX_LENGTH).toBeGreaterThan(0);
    });

    it("devrait permettre une bio vide", () => {
      expect(BIO_CONFIG.MIN_LENGTH).toBe(0);
    });
  });

  describe("PSEUDO_CONFIG", () => {
    it("devrait avoir des longueurs min et max", () => {
      expect(PSEUDO_CONFIG.MIN_LENGTH).toBeGreaterThan(0);
      expect(PSEUDO_CONFIG.MAX_LENGTH).toBeGreaterThan(PSEUDO_CONFIG.MIN_LENGTH);
    });

    it("devrait avoir un pattern regex", () => {
      expect(PSEUDO_CONFIG.PATTERN).toBeInstanceOf(RegExp);
    });

    it("devrait avoir des pseudos reserves", () => {
      expect(PSEUDO_CONFIG.RESERVED).toContain("admin");
      expect(PSEUDO_CONFIG.RESERVED).toContain("root");
    });

    it("le pattern devrait valider des pseudos corrects", () => {
      expect(PSEUDO_CONFIG.PATTERN.test("user123")).toBe(true);
      expect(PSEUDO_CONFIG.PATTERN.test("user_name")).toBe(true);
      expect(PSEUDO_CONFIG.PATTERN.test("user-name")).toBe(true);
    });

    it("le pattern devrait rejeter des pseudos invalides", () => {
      expect(PSEUDO_CONFIG.PATTERN.test("user name")).toBe(false);
      expect(PSEUDO_CONFIG.PATTERN.test("user@name")).toBe(false);
    });
  });

  describe("AGE_CONFIG", () => {
    it("devrait avoir un age minimum de 13 ans (COPPA)", () => {
      expect(AGE_CONFIG.MINIMUM).toBe(13);
    });
  });

  describe("CLEANUP_CONFIG", () => {
    it("devrait avoir un intervalle de nettoyage", () => {
      expect(CLEANUP_CONFIG.INTERVAL).toBeGreaterThan(0);
    });
  });

  describe("SOCKET_EVENTS", () => {
    it("devrait avoir les evenements de connexion", () => {
      expect(SOCKET_EVENTS.CONNECTION).toBe("connection");
      expect(SOCKET_EVENTS.DISCONNECT).toBe("disconnect");
    });

    it("devrait avoir les evenements utilisateur", () => {
      expect(SOCKET_EVENTS.USER_CONNECT).toBeDefined();
      expect(SOCKET_EVENTS.USER_ONLINE).toBeDefined();
      expect(SOCKET_EVENTS.USER_OFFLINE).toBeDefined();
    });

    it("devrait avoir les evenements de message", () => {
      expect(SOCKET_EVENTS.MESSAGE_SEND).toBeDefined();
      expect(SOCKET_EVENTS.MESSAGE_NEW).toBeDefined();
      expect(SOCKET_EVENTS.MESSAGE_DELETE).toBeDefined();
    });

    it("devrait avoir les evenements d image", () => {
      expect(SOCKET_EVENTS.IMAGE_VIEWED).toBeDefined();
      expect(SOCKET_EVENTS.IMAGE_EXPIRED).toBeDefined();
    });

    it("devrait avoir les evenements de typing", () => {
      expect(SOCKET_EVENTS.TYPING_START).toBeDefined();
      expect(SOCKET_EVENTS.TYPING_STOP).toBeDefined();
    });
  });

  describe("REJECTION_REASONS", () => {
    it("devrait avoir des raisons de rejet predefinies", () => {
      expect(REJECTION_REASONS.INAPPROPRIATE_PHOTO).toBeDefined();
      expect(REJECTION_REASONS.FAKE_PROFILE).toBeDefined();
      expect(REJECTION_REASONS.SPAM).toBeDefined();
      expect(REJECTION_REASONS.UNDERAGE).toBeDefined();
    });

    it("devrait avoir une option OTHER", () => {
      expect(REJECTION_REASONS.OTHER).toBeDefined();
    });
  });
});
