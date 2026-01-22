/**
 * ============================================
 * IMAGE SERVICE TESTS
 * ============================================
 *
 * Tests unitaires pour le service de traitement d'images
 * Focus sur la validation des magic bytes
 */

// Mock de sharp
jest.mock("sharp", () => {
  return jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: "jpeg",
      hasAlpha: false,
    }),
    resize: jest.fn().mockReturnThis(),
    composite: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed-image")),
  }));
});

// Mock des constantes
jest.mock("../utils/constants", () => ({
  IMAGE_CONFIG: {
    MAX_SIZE: 5 * 1024 * 1024,
    MAX_WIDTH: 800,
    MAX_HEIGHT: 800,
    QUALITY: 80,
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    ALLOWED_EXTENSIONS: ["jpeg", "jpg", "png", "gif", "webp"],
  },
}));

const ImageService = require("../services/imageService");

describe("ImageService", () => {
  describe("validateMagicBytes", () => {
    it("devrait rejeter un buffer null", () => {
      const result = ImageService.validateMagicBytes(null);

      expect(result.valid).toBe(false);
      expect(result.format).toBeNull();
    });

    it("devrait rejeter un buffer trop petit", () => {
      const smallBuffer = Buffer.from([0xff, 0xd8]);

      const result = ImageService.validateMagicBytes(smallBuffer);

      expect(result.valid).toBe(false);
    });

    it("devrait détecter un fichier JPEG (JFIF)", () => {
      // JPEG JFIF magic bytes
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

      const result = ImageService.validateMagicBytes(jpegBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("jpeg");
    });

    it("devrait détecter un fichier JPEG (EXIF)", () => {
      // JPEG EXIF magic bytes
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78]);

      const result = ImageService.validateMagicBytes(jpegBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("jpeg");
    });

    it("devrait détecter un fichier PNG", () => {
      // PNG magic bytes
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      const result = ImageService.validateMagicBytes(pngBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("png");
    });

    it("devrait détecter un fichier GIF87a", () => {
      // GIF87a magic bytes
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00]);

      const result = ImageService.validateMagicBytes(gifBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("gif");
    });

    it("devrait détecter un fichier GIF89a", () => {
      // GIF89a magic bytes
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00]);

      const result = ImageService.validateMagicBytes(gifBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("gif");
    });

    it("devrait détecter un fichier WebP", () => {
      // WebP magic bytes: RIFF....WEBP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);

      const result = ImageService.validateMagicBytes(webpBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe("webp");
    });

    it("devrait rejeter un fichier RIFF qui n'est pas WebP", () => {
      // RIFF but not WebP (e.g., AVI)
      const aviBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
      ]);

      const result = ImageService.validateMagicBytes(aviBuffer);

      expect(result.valid).toBe(false);
    });

    it("devrait rejeter un fichier PDF", () => {
      // PDF magic bytes
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

      const result = ImageService.validateMagicBytes(pdfBuffer);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Format de fichier non reconnu");
    });

    it("devrait rejeter un fichier ZIP", () => {
      // ZIP magic bytes
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);

      const result = ImageService.validateMagicBytes(zipBuffer);

      expect(result.valid).toBe(false);
    });

    it("devrait rejeter un fichier exécutable", () => {
      // EXE/PE magic bytes
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

      const result = ImageService.validateMagicBytes(exeBuffer);

      expect(result.valid).toBe(false);
    });
  });

  describe("validateImage", () => {
    it("devrait rejeter si aucun fichier fourni", () => {
      const result = ImageService.validateImage(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Aucun fichier fourni");
    });

    it("devrait rejeter un type MIME non autorisé", () => {
      const file = {
        mimetype: "application/pdf",
        size: 1000,
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Type de fichier non autorisé");
    });

    it("devrait rejeter un fichier trop volumineux", () => {
      const file = {
        mimetype: "image/jpeg",
        size: 10 * 1024 * 1024, // 10MB
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Fichier trop volumineux");
    });

    it("devrait rejeter si magic bytes invalides", () => {
      const file = {
        mimetype: "image/jpeg",
        size: 1000,
        buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]), // PDF
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Le contenu du fichier ne correspond pas à une image valide");
    });

    it("devrait rejeter si MIME ne correspond pas aux magic bytes", () => {
      const file = {
        mimetype: "image/png",
        size: 1000,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]), // JPEG
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Le type MIME ne correspond pas au contenu du fichier");
    });

    it("devrait accepter un fichier JPEG valide", () => {
      const file = {
        mimetype: "image/jpeg",
        size: 1000,
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]),
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(true);
    });

    it("devrait accepter un fichier PNG valide", () => {
      const file = {
        mimetype: "image/png",
        size: 1000,
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(true);
    });

    it("devrait accepter un fichier sans buffer (validation MIME seule)", () => {
      const file = {
        mimetype: "image/jpeg",
        size: 1000,
        // Pas de buffer
      };

      const result = ImageService.validateImage(file);

      expect(result.valid).toBe(true);
    });
  });
});
