/**
 * Tests pour les fonctions utilitaires helpers.js
 */

const {
  formatDate,
  generateSlug,
  paginate,
  generateRoomId,
  isValidEmail,
  cleanObject,
  sleep,
  getTimeRemaining,
  truncate,
  randomInt,
  generateProfileDefaults,
} = require("../utils/helpers");

describe("Helpers - Fonctions utilitaires", () => {
  describe("formatDate", () => {
    it("devrait formater une date correctement", () => {
      const date = new Date("2024-01-15T10:30:00");
      const result = formatDate(date);
      expect(result).toContain("2024");
      expect(result).toContain("janvier");
      expect(result).toContain("15");
    });

    it("devrait accepter une chaine de date", () => {
      const result = formatDate("2024-06-20T14:00:00");
      expect(result).toContain("2024");
      expect(result).toContain("juin");
    });
  });

  describe("generateSlug", () => {
    it("devrait generer un slug valide", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("devrait retirer les caracteres speciaux", () => {
      expect(generateSlug("Test@#$%^&*()")).toBe("test");
    });

    it("devrait gerer les espaces multiples", () => {
      expect(generateSlug("Multiple   Spaces")).toBe("multiple-spaces");
    });

    it("devrait retirer les tirets en debut et fin", () => {
      expect(generateSlug("  Test  ")).toBe("test");
    });

    it("devrait gerer une chaine vide", () => {
      expect(generateSlug("")).toBe("");
    });

    it("devrait gerer les accents", () => {
      expect(generateSlug("Cafe Resume")).toBe("cafe-resume");
    });
  });

  describe("paginate", () => {
    it("devrait calculer offset pour la page 1", () => {
      const result = paginate(1, 20);
      expect(result).toEqual({ limit: 20, offset: 0 });
    });

    it("devrait calculer offset pour la page 2", () => {
      const result = paginate(2, 20);
      expect(result).toEqual({ limit: 20, offset: 20 });
    });

    it("devrait calculer offset pour la page 5 avec limit 10", () => {
      const result = paginate(5, 10);
      expect(result).toEqual({ limit: 10, offset: 40 });
    });

    it("devrait utiliser les valeurs par defaut", () => {
      const result = paginate();
      expect(result).toEqual({ limit: 20, offset: 0 });
    });
  });

  describe("generateRoomId", () => {
    it("devrait generer un ID de room coherent", () => {
      expect(generateRoomId(1, 2)).toBe("conversation_1_2");
    });

    it("devrait toujours mettre le plus petit ID en premier", () => {
      expect(generateRoomId(5, 3)).toBe("conversation_3_5");
      expect(generateRoomId(3, 5)).toBe("conversation_3_5");
    });

    it("devrait gerer le meme ID deux fois", () => {
      expect(generateRoomId(4, 4)).toBe("conversation_4_4");
    });
  });

  describe("isValidEmail", () => {
    it("devrait valider un email correct", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("devrait valider un email avec sous-domaine", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("devrait rejeter un email sans @", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("devrait rejeter un email sans domaine", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("devrait rejeter un email sans extension", () => {
      expect(isValidEmail("test@example")).toBe(false);
    });

    it("devrait rejeter un email avec espaces", () => {
      expect(isValidEmail("test @example.com")).toBe(false);
    });

    it("devrait rejeter une chaine vide", () => {
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("cleanObject", () => {
    it("devrait retirer les valeurs null", () => {
      const obj = { a: 1, b: null, c: 3 };
      expect(cleanObject(obj)).toEqual({ a: 1, c: 3 });
    });

    it("devrait retirer les valeurs undefined", () => {
      const obj = { a: 1, b: undefined, c: 3 };
      expect(cleanObject(obj)).toEqual({ a: 1, c: 3 });
    });

    it("devrait garder les valeurs 0 et false", () => {
      const obj = { a: 0, b: false, c: "" };
      expect(cleanObject(obj)).toEqual({ a: 0, b: false, c: "" });
    });

    it("devrait retourner un objet vide si tout est null", () => {
      const obj = { a: null, b: undefined };
      expect(cleanObject(obj)).toEqual({});
    });
  });

  describe("sleep", () => {
    it("devrait attendre le temps specifie", async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe("getTimeRemaining", () => {
    it("devrait retourner expired true si la date est passee", () => {
      const pastDate = new Date(Date.now() - 10000);
      const result = getTimeRemaining(pastDate);
      expect(result.expired).toBe(true);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it("devrait calculer le temps restant correctement", () => {
      const futureDate = new Date(Date.now() + 125000); // 2 min 5 sec
      const result = getTimeRemaining(futureDate);
      expect(result.expired).toBe(false);
      expect(result.minutes).toBe(2);
      expect(result.seconds).toBeGreaterThanOrEqual(3);
      expect(result.seconds).toBeLessThanOrEqual(5);
    });

    it("devrait accepter une chaine de date", () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const result = getTimeRemaining(futureDate);
      expect(result.expired).toBe(false);
    });
  });

  describe("truncate", () => {
    it("devrait tronquer un texte long", () => {
      const text = "Ceci est un texte tres long qui doit etre tronque";
      const result = truncate(text, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.endsWith("...")).toBe(true);
    });

    it("devrait garder un texte court intact", () => {
      const text = "Court";
      expect(truncate(text, 20)).toBe("Court");
    });

    it("devrait utiliser un suffixe personnalise", () => {
      const text = "Un texte assez long pour etre tronque";
      const result = truncate(text, 15, "~");
      expect(result.endsWith("~")).toBe(true);
    });

    it("devrait gerer la longueur par defaut", () => {
      const text = "a".repeat(100);
      const result = truncate(text);
      expect(result.length).toBe(50);
    });
  });

  describe("randomInt", () => {
    it("devrait generer un nombre dans la plage", () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it("devrait inclure les bornes", () => {
      const results = new Set();
      for (let i = 0; i < 1000; i++) {
        results.add(randomInt(1, 3));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
    });

    it("devrait retourner le meme nombre si min = max", () => {
      expect(randomInt(5, 5)).toBe(5);
    });
  });

  describe("generateProfileDefaults", () => {
    it("devrait generer un pseudo depuis l email", () => {
      const user = { id: 1, email: "test@example.com" };
      const result = generateProfileDefaults(user);
      expect(result.pseudo).toBe("user_test_1");
    });

    it("devrait generer un pseudo sans email", () => {
      const user = { id: 5 };
      const result = generateProfileDefaults(user);
      expect(result.pseudo).toBe("user_5");
    });

    it("devrait generer un nom depuis le pseudo", () => {
      const user = { id: 1, pseudo: "MonPseudo" };
      const result = generateProfileDefaults(user);
      expect(result.nom).toBe("MonPseudo");
    });

    it("devrait generer une ville par defaut", () => {
      const user = { id: 1, pseudo: "test", nom: "Test", email: "test@test.com" };
      const result = generateProfileDefaults(user);
      expect(result.ville).toBe("Non spécifié");
    });

    it("devrait ne rien generer si tout est rempli", () => {
      const user = {
        id: 1,
        pseudo: "test",
        nom: "Test User",
        email: "test@test.com",
        ville: "Paris",
      };
      const result = generateProfileDefaults(user);
      expect(Object.keys(result).length).toBe(0);
    });

    it("devrait generer un email par defaut", () => {
      const user = { id: 3, pseudo: "test", nom: "Test" };
      const result = generateProfileDefaults(user);
      expect(result.email).toBe("user3@messagerie-app.local");
    });
  });
});
