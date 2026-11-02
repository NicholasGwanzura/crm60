import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { aiConfiguration: { findUnique } } }));
import { deepSeekConfiguration, encryptKey, requestLeadSummary, verifyDeepSeekKey } from "@/lib/deepseek";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("DeepSeek key storage", () => {
  it("encrypts with distinct nonces and decrypts only on the server", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-for-encryption-with-at-least-32-characters");
    const key = "test-api-key";
    const encrypted = encryptKey(key);
    expect(encrypted).not.toContain(key);
    expect(encrypted).not.toEqual(encryptKey(key));
    findUnique.mockResolvedValue({ encryptedKey: encrypted, model: "test-model", enabled: true });
    expect(await deepSeekConfiguration()).toEqual({ key, model: "test-model", enabled: true });
  });
  it("rejects tampered ciphertext", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-for-encryption-with-at-least-32-characters");
    const parts = encryptKey("test-api-key").split(".");
    const ciphertext = Buffer.from(parts[2], "base64"); ciphertext[0] ^= 1;
    parts[2] = ciphertext.toString("base64");
    findUnique.mockResolvedValue({ encryptedKey: parts.join("."), enabled: true });
    await expect(deepSeekConfiguration()).rejects.toThrow();
  });
  it("respects explicit disable even when an environment key exists", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "environment-key");
    findUnique.mockResolvedValue({ enabled: false, model: "test-model", encryptedKey: null });
    expect((await deepSeekConfiguration()).enabled).toBe(false);
  });
  it("requires the configured model to be available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({data:[{id:"available-model"}]}) }));
    expect(await verifyDeepSeekKey("key", "missing-model")).toBe(false);
  });
  it("never exposes upstream error bodies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, text: async () => "sensitive upstream details" }));
    await expect(requestLeadSummary("key", "model", {})).rejects.toThrow("AI request failed");
  });
});
