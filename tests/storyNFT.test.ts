import { describe, it, expect, beforeEach } from "vitest";
import { buffCV, optionalCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TOKEN_ID = 101;
const ERR_INVALID_METADATA = 102;
const ERR_INVALID_HASH = 103;
const ERR_TOKEN_ALREADY_EXISTS = 104;
const ERR_TOKEN_NOT_FOUND = 105;
const ERR_TRANSFER_NOT_ALLOWED = 106;
const ERR_BURN_NOT_ALLOWED = 107;
const ERR_INVALID_OWNER = 108;
const ERR_INVALID_RECIPIENT = 109;
const ERR_MINT_PAUSED = 110;
const ERR_INVALID_TITLE = 111;
const ERR_INVALID_DESCRIPTION = 112;
const ERR_INVALID_MEDIA_LINK = 113;
const ERR_MAX_MINT_EXCEEDED = 114;
const ERR_INVALID_TIMESTAMP = 115;
const ERR_PROVENANCE_NOT_SET = 116;
const ERR_INVALID_PROVENANCE_ID = 117;
const ERR_UPDATE_NOT_ALLOWED = 118;
const ERR_INVALID_UPDATE_PARAM = 119;
const ERR_AUTHORITY_NOT_VERIFIED = 120;

interface Token {
  owner: string;
  contentHash: Uint8Array;
  title: string;
  description: string;
  mediaLink: string | null;
  timestamp: number;
  provenanceId: number | null;
}

interface TokenUpdate {
  updateTitle: string;
  updateDescription: string;
  updateMediaLink: string | null;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class StoryNFTMock {
  state: {
    nextTokenId: number;
    maxMintPerUser: number;
    mintPaused: boolean;
    contractOwner: string;
    provenanceTracker: string | null;
    tokens: Map<number, Token>;
    tokenOwners: Map<number, string>;
    userMintCount: Map<string, number>;
    tokenUpdates: Map<number, TokenUpdate>;
  } = {
    nextTokenId: 0,
    maxMintPerUser: 10,
    mintPaused: false,
    contractOwner: "ST1OWNER",
    provenanceTracker: null,
    tokens: new Map(),
    tokenOwners: new Map(),
    userMintCount: new Map(),
    tokenUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  events: Array<{ event: string; [key: string]: any }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextTokenId: 0,
      maxMintPerUser: 10,
      mintPaused: false,
      contractOwner: "ST1OWNER",
      provenanceTracker: null,
      tokens: new Map(),
      tokenOwners: new Map(),
      userMintCount: new Map(),
      tokenUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.events = [];
  }

  setProvenanceTracker(contractPrincipal: string): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (contractPrincipal === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_OWNER };
    this.state.provenanceTracker = contractPrincipal;
    return { ok: true, value: true };
  }

  setMaxMintPerUser(newMax: number): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    this.state.maxMintPerUser = newMax;
    return { ok: true, value: true };
  }

  toggleMintPause(): Result<boolean> {
    if (this.caller !== this.state.contractOwner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.mintPaused = !this.state.mintPaused;
    return { ok: true, value: this.state.mintPaused };
  }

  mintStory(
    contentHash: Uint8Array,
    title: string,
    description: string,
    mediaLink: string | null,
    provenanceId: number | null
  ): Result<number> {
    if (this.state.mintPaused) return { ok: false, value: ERR_MINT_PAUSED };
    const userCount = this.state.userMintCount.get(this.caller) || 0;
    if (userCount >= this.state.maxMintPerUser) return { ok: false, value: ERR_MAX_MINT_EXCEEDED };
    if (contentHash.length !== 32) return { ok: false, value: ERR_INVALID_HASH };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (mediaLink && mediaLink.length > 200) return { ok: false, value: ERR_INVALID_MEDIA_LINK };
    if (provenanceId !== null && provenanceId <= 0) return { ok: false, value: ERR_INVALID_PROVENANCE_ID };
    if (this.state.tokens.has(this.state.nextTokenId)) return { ok: false, value: ERR_TOKEN_ALREADY_EXISTS };
    if (!this.state.provenanceTracker) return { ok: false, value: ERR_PROVENANCE_NOT_SET };

    const id = this.state.nextTokenId;
    const token: Token = {
      owner: this.caller,
      contentHash,
      title,
      description,
      mediaLink,
      timestamp: this.blockHeight,
      provenanceId,
    };
    this.state.tokens.set(id, token);
    this.state.tokenOwners.set(id, this.caller);
    this.state.userMintCount.set(this.caller, userCount + 1);
    this.state.nextTokenId++;
    this.events.push({ event: "story-minted", id });
    return { ok: true, value: id };
  }

  transferStory(id: number, recipient: string): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: ERR_TOKEN_NOT_FOUND };
    if (token.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (recipient === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_RECIPIENT };
    this.state.tokens.set(id, { ...token, owner: recipient });
    this.state.tokenOwners.set(id, recipient);
    this.events.push({ event: "story-transferred", id, to: recipient });
    return { ok: true, value: true };
  }

  burnStory(id: number): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: ERR_TOKEN_NOT_FOUND };
    if (token.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.tokens.delete(id);
    this.state.tokenOwners.delete(id);
    this.events.push({ event: "story-burned", id });
    return { ok: true, value: true };
  }

  updateStoryMetadata(
    id: number,
    newTitle: string,
    newDescription: string,
    newMediaLink: string | null
  ): Result<boolean> {
    const token = this.state.tokens.get(id);
    if (!token) return { ok: false, value: ERR_TOKEN_NOT_FOUND };
    if (token.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!newTitle || newTitle.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (newDescription.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (newMediaLink && newMediaLink.length > 200) return { ok: false, value: ERR_INVALID_MEDIA_LINK };
    this.state.tokens.set(id, {
      ...token,
      title: newTitle,
      description: newDescription,
      mediaLink: newMediaLink,
      timestamp: this.blockHeight,
    });
    this.state.tokenUpdates.set(id, {
      updateTitle: newTitle,
      updateDescription: newDescription,
      updateMediaLink: newMediaLink,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    this.events.push({ event: "story-updated", id });
    return { ok: true, value: true };
  }

  getNextTokenId(): Result<number> {
    return { ok: true, value: this.state.nextTokenId };
  }

  verifyOwner(id: number, claimedOwner: string): Result<boolean> {
    const owner = this.state.tokenOwners.get(id);
    if (!owner) return { ok: false, value: ERR_TOKEN_NOT_FOUND };
    return { ok: true, value: owner === claimedOwner };
  }

  getToken(id: number): Token | null {
    return this.state.tokens.get(id) || null;
  }
}

describe("StoryNFT", () => {
  let contract: StoryNFTMock;

  beforeEach(() => {
    contract = new StoryNFTMock();
    contract.reset();
  });

  it("mints a story successfully", () => {
    contract.state.contractOwner = "ST1TEST";
    contract.setProvenanceTracker("ST2PROV");
    const hash = new Uint8Array(32).fill(1);
    const result = contract.mintStory(hash, "Title", "Desc", "link.com", 1);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const token = contract.getToken(0);
    expect(token?.title).toBe("Title");
    expect(token?.description).toBe("Desc");
    expect(token?.mediaLink).toBe("link.com");
    expect(token?.provenanceId).toBe(1);
    expect(contract.events).toEqual([{ event: "story-minted", id: 0 }]);
  });

  it("rejects mint when paused", () => {
    contract.state.contractOwner = "ST1TEST";
    contract.toggleMintPause();
    const hash = new Uint8Array(32).fill(1);
    const result = contract.mintStory(hash, "Title", "Desc", null, null);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MINT_PAUSED);
  });

  it("rejects mint without provenance set", () => {
    const hash = new Uint8Array(32).fill(1);
    const result = contract.mintStory(hash, "Title", "Desc", null, null);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PROVENANCE_NOT_SET);
  });

  it("rejects invalid content hash", () => {
    contract.setProvenanceTracker("ST2PROV");
    const hash = new Uint8Array(31).fill(1);
    const result = contract.mintStory(hash, "Title", "Desc", null, null);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_HASH);
  });

  it("sets max mint per user successfully", () => {
    contract.state.contractOwner = "ST1TEST";
    const result = contract.setMaxMintPerUser(5);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.maxMintPerUser).toBe(5);
  });

  it("rejects max mint set by non-owner", () => {
    const result = contract.setMaxMintPerUser(5);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("gets next token id correctly", () => {
    const result = contract.getNextTokenId();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
  });
});