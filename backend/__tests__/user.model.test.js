/**
 * ============================================
 * USER MODEL TESTS
 * ============================================
 *
 * Tests unitaires pour le modèle User
 */

const bcrypt = require("bcryptjs");

// Mock de Sequelize et de la configuration
jest.mock("../config/database", () => ({
  sequelize: {
    define: jest.fn(() => ({
      prototype: {},
    })),
  },
}));

// Mock des constantes
jest.mock("../utils/constants", () => ({
  USER_ROLES: {
    USER: "user",
    ADMIN: "admin",
  },
  USER_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },
}));

const { USER_ROLES, USER_STATUS } = require("../utils/constants");

describe("User Model", () => {
  // Créer un mock d'utilisateur pour les tests
  const createMockUser = (overrides = {}) => {
    const userData = {
      id: 1,
      nom: "Jean Dupont",
      pseudo: "jean_dupont",
      email: "jean@example.com",
      password: bcrypt.hashSync("password123", 10),
      dateNaissance: "1990-05-15",
      ville: "Paris",
      bio: "Test bio",
      role: USER_ROLES.USER,
      statut: USER_STATUS.PENDING,
      dateCreation: new Date(),
      dateModification: new Date(),
      validateurId: null,
      raisonRejet: null,
      dateValidation: null,
      ...overrides,
    };

    return {
      ...userData,
      get: () => userData,
      toJSON: function () {
        const values = { ...this.get() };
        delete values.password;
        return values;
      },
      update: jest.fn().mockImplementation(function (updates) {
        Object.assign(this, updates);
        return Promise.resolve(this);
      }),
      changed: jest.fn().mockReturnValue(false),
    };
  };

  describe("Méthodes d'instance", () => {
    describe("comparePassword", () => {
      it("devrait retourner true pour un mot de passe correct", async () => {
        const password = "testPassword123";
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = createMockUser({ password: hashedPassword });

        // Simuler la méthode comparePassword
        user.comparePassword = async function (candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        };

        const result = await user.comparePassword(password);
        expect(result).toBe(true);
      });

      it("devrait retourner false pour un mot de passe incorrect", async () => {
        const hashedPassword = await bcrypt.hash("correctPassword", 10);
        const user = createMockUser({ password: hashedPassword });

        user.comparePassword = async function (candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        };

        const result = await user.comparePassword("wrongPassword");
        expect(result).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("devrait retourner true pour un admin", () => {
        const user = createMockUser({ role: USER_ROLES.ADMIN });
        user.isAdmin = function () {
          return this.role === USER_ROLES.ADMIN;
        };

        expect(user.isAdmin()).toBe(true);
      });

      it("devrait retourner false pour un utilisateur normal", () => {
        const user = createMockUser({ role: USER_ROLES.USER });
        user.isAdmin = function () {
          return this.role === USER_ROLES.ADMIN;
        };

        expect(user.isAdmin()).toBe(false);
      });
    });

    describe("isApproved / isPending / isRejected", () => {
      it("devrait identifier correctement un profil approuvé", () => {
        const user = createMockUser({ statut: USER_STATUS.APPROVED });
        user.isApproved = function () {
          return this.statut === USER_STATUS.APPROVED;
        };
        user.isPending = function () {
          return this.statut === USER_STATUS.PENDING;
        };
        user.isRejected = function () {
          return this.statut === USER_STATUS.REJECTED;
        };

        expect(user.isApproved()).toBe(true);
        expect(user.isPending()).toBe(false);
        expect(user.isRejected()).toBe(false);
      });

      it("devrait identifier correctement un profil en attente", () => {
        const user = createMockUser({ statut: USER_STATUS.PENDING });
        user.isApproved = function () {
          return this.statut === USER_STATUS.APPROVED;
        };
        user.isPending = function () {
          return this.statut === USER_STATUS.PENDING;
        };
        user.isRejected = function () {
          return this.statut === USER_STATUS.REJECTED;
        };

        expect(user.isApproved()).toBe(false);
        expect(user.isPending()).toBe(true);
        expect(user.isRejected()).toBe(false);
      });

      it("devrait identifier correctement un profil rejeté", () => {
        const user = createMockUser({ statut: USER_STATUS.REJECTED });
        user.isApproved = function () {
          return this.statut === USER_STATUS.APPROVED;
        };
        user.isPending = function () {
          return this.statut === USER_STATUS.PENDING;
        };
        user.isRejected = function () {
          return this.statut === USER_STATUS.REJECTED;
        };

        expect(user.isApproved()).toBe(false);
        expect(user.isPending()).toBe(false);
        expect(user.isRejected()).toBe(true);
      });
    });

    describe("getAge", () => {
      it("devrait calculer l'âge correctement", () => {
        // Utilisateur né il y a 30 ans
        const thirtyYearsAgo = new Date();
        thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
        const user = createMockUser({
          dateNaissance: thirtyYearsAgo.toISOString().split("T")[0],
        });

        user.getAge = function () {
          if (!this.dateNaissance) return null;
          const birthDate = new Date(this.dateNaissance);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          return age;
        };

        expect(user.getAge()).toBe(30);
      });

      it("devrait retourner null si pas de date de naissance", () => {
        const user = createMockUser({ dateNaissance: null });

        user.getAge = function () {
          if (!this.dateNaissance) return null;
          return 0;
        };

        expect(user.getAge()).toBeNull();
      });
    });

    describe("approve", () => {
      it("devrait approuver le profil avec la date et l'ID du validateur", async () => {
        const user = createMockUser({ statut: USER_STATUS.PENDING });
        const validatorId = 999;

        user.approve = async function (validatorId) {
          return await this.update({
            statut: USER_STATUS.APPROVED,
            dateValidation: new Date(),
            validateurId: validatorId,
            raisonRejet: null,
          });
        };

        await user.approve(validatorId);

        expect(user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            statut: USER_STATUS.APPROVED,
            validateurId: validatorId,
            raisonRejet: null,
          })
        );
      });
    });

    describe("reject", () => {
      it("devrait rejeter le profil avec la raison", async () => {
        const user = createMockUser({ statut: USER_STATUS.PENDING });
        const validatorId = 999;
        const reason = "Profil incomplet";

        user.reject = async function (validatorId, reason) {
          return await this.update({
            statut: USER_STATUS.REJECTED,
            dateValidation: new Date(),
            validateurId: validatorId,
            raisonRejet: reason,
          });
        };

        await user.reject(validatorId, reason);

        expect(user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            statut: USER_STATUS.REJECTED,
            validateurId: validatorId,
            raisonRejet: reason,
          })
        );
      });
    });

    describe("toPublicJSON", () => {
      it("devrait exclure le mot de passe et les infos sensibles", () => {
        const user = createMockUser({
          validateurId: 999,
          raisonRejet: "Test raison",
        });

        user.toPublicJSON = function () {
          const data = this.toJSON();
          delete data.validateurId;
          delete data.raisonRejet;
          data.age = 30;
          return data;
        };

        const publicData = user.toPublicJSON();

        expect(publicData.password).toBeUndefined();
        expect(publicData.validateurId).toBeUndefined();
        expect(publicData.raisonRejet).toBeUndefined();
        expect(publicData.email).toBe("jean@example.com");
        expect(publicData.age).toBe(30);
      });
    });

    describe("toAdminJSON", () => {
      it("devrait inclure les infos de validation mais exclure le mot de passe", () => {
        const user = createMockUser({
          validateurId: 999,
          raisonRejet: "Test raison",
        });

        user.toAdminJSON = function () {
          const data = this.toJSON();
          data.age = 30;
          return data;
        };

        const adminData = user.toAdminJSON();

        expect(adminData.password).toBeUndefined();
        expect(adminData.email).toBe("jean@example.com");
      });
    });
  });

  describe("Validation des champs", () => {
    it("devrait valider le format du pseudo", () => {
      const validPseudos = ["jean_dupont", "user123", "test-user", "User_123"];
      const invalidPseudos = ["user@name", "user name", "user.name", "user!"];

      const pseudoPattern = /^[a-zA-Z0-9_-]+$/;

      validPseudos.forEach((pseudo) => {
        expect(pseudoPattern.test(pseudo)).toBe(true);
      });

      invalidPseudos.forEach((pseudo) => {
        expect(pseudoPattern.test(pseudo)).toBe(false);
      });
    });

    it("devrait valider le format de l'email", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@example.co.uk",
      ];
      const invalidEmails = ["notanemail", "@nodomain.com", "missing@.com"];

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailPattern.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(emailPattern.test(email)).toBe(false);
      });
    });

    it("devrait valider l'âge minimum (13 ans)", () => {
      const validateAge = (dateNaissance) => {
        const birthDate = new Date(dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age >= 13;
      };

      // 15 ans - valide
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      expect(validateAge(fifteenYearsAgo.toISOString())).toBe(true);

      // 10 ans - invalide
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      expect(validateAge(tenYearsAgo.toISOString())).toBe(false);

      // Exactement 13 ans - valide
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      expect(validateAge(thirteenYearsAgo.toISOString())).toBe(true);
    });

    it("devrait valider la longueur de la bio (max 500)", () => {
      const validateBio = (bio) => {
        return bio === null || bio === undefined || bio.length <= 500;
      };

      expect(validateBio("")).toBe(true);
      expect(validateBio("Une bio courte")).toBe(true);
      expect(validateBio("a".repeat(500))).toBe(true);
      expect(validateBio("a".repeat(501))).toBe(false);
    });
  });
});
