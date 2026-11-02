import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), lead: vi.fn(), config: vi.fn(), request: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ currentUser: mocks.user }));
vi.mock("@/lib/permissions", () => ({ leadScope: async () => ({ organisationId: "allowed-org" }) }));
vi.mock("@/lib/db", () => ({ db: { lead: { findFirst: mocks.lead }, aiRateLimit: { upsert: vi.fn(), updateMany: mocks.update } } }));
vi.mock("@/lib/deepseek", () => ({ deepSeekConfiguration: mocks.config, requestLeadSummary: mocks.request }));
import { summarizeLead } from "@/app/(workspace)/leads/ai-actions";
const id = "f34801ec-e506-4b6e-bde3-01152f21fe3e";
beforeEach(() => vi.clearAllMocks());
it("blocks anonymous requests before loading data or calling DeepSeek", async () => {
  mocks.user.mockResolvedValue(null);
  expect((await summarizeLead(id)).error).toContain("Sign in");
  expect(mocks.lead).not.toHaveBeenCalled(); expect(mocks.request).not.toHaveBeenCalled();
});
it("applies record scope and does not send inaccessible leads", async () => {
  mocks.user.mockResolvedValue({id:"user"}); mocks.lead.mockResolvedValue(null);
  expect((await summarizeLead(id)).error).toContain("unavailable");
  expect(mocks.lead.mock.calls[0][0].where.AND).toContainEqual({organisationId:"allowed-org"});
  expect(mocks.request).not.toHaveBeenCalled();
});
it("does not send data when the rate limit is reached", async () => {
  mocks.user.mockResolvedValue({id:"user"}); mocks.lead.mockResolvedValue({title:"Lead"});
  mocks.config.mockResolvedValue({enabled:true,key:"key"}); mocks.update.mockResolvedValue({count:0});
  expect((await summarizeLead(id)).error).toContain("30 seconds");
  expect(mocks.request).not.toHaveBeenCalled();
});
