import { describe, expect, it } from "vitest";
import { pickCustomDesign, pickedDesign, readOnlyMine } from "./rotation";

const A = { id: "a", version: 1 };
const B = { id: "b", version: 2 };
const custom = (id: string) => ({ layout: "CUSTOM", custom: { id } });
const opts = { onlyMine: false, firstPost: false };

describe("pickCustomDesign", () => {
  it("does nothing without designs", () => expect(pickCustomDesign([], [], opts)).toBeNull());
  it("alternates: none right after a custom cover", () => expect(pickCustomDesign([A], [custom("a")], opts)).toBeNull());
  it("uses a design after a built-in cover", () => expect(pickCustomDesign([A], [{ layout: "HEADLINE" }], opts)).toEqual(A));
  it("keeps the first post's bold opener", () => expect(pickCustomDesign([A], [], { ...opts, firstPost: true })).toBeNull());
  it("takes the least recently used design", () => {
    expect(pickCustomDesign([A, B], [{ layout: "HEADLINE" }, custom("a")], opts)).toEqual(B);
    expect(pickCustomDesign([A, B], [{ layout: "HEADLINE" }, custom("b"), custom("a")], opts)).toEqual(A);
  });
  it("only-mine uses a design every time, even the first post", () => {
    expect(pickCustomDesign([A], [custom("a")], { onlyMine: true, firstPost: true })).toEqual(A);
  });
  it("reads the switch only when it is exactly true", () => {
    expect(readOnlyMine({ cover_custom_only: true })).toBe(true);
    expect(readOnlyMine({ cover_custom_only: "true" })).toBe(false);
    expect(readOnlyMine(null)).toBe(false);
  });
});

describe("pickedDesign (a reviewer picks one in the editor, task 100)", () => {
  it("finds an active design by id, at its newest version", () => expect(pickedDesign([A, B], "b")).toEqual(B));
  it("refuses one that is archived, unknown or another workspace's (not in this list)", () => {
    expect(pickedDesign([A], "b")).toBeNull();
    expect(pickedDesign([], "a")).toBeNull();
  });
});
