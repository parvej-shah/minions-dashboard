import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_COVER_BRAND } from "@/lib/covers/brand";
import { CoverFitError, type CoverAuthor } from "@/lib/covers/layouts";
import { SLIDE_STYLES, slideElement, smartQuotes, type Deck, type Slide } from "./slides";
import { renderCarouselPdf } from "./render";

const author: CoverAuthor = { name: "Parvej Shah", role: "Builds AI voice agents" };
const brand = DEFAULT_COVER_BRAND;

function deck(slides: Slide[]): Deck {
  return {
    label: "Voice AI bookings",
    slides,
    author,
    brand,
    cover: { layout: "HEADLINE", headline: "Your voice agent books showings your calendar never sees", emphasis: "never", author, brand },
  };
}

const EVERY_LAYOUT: Slide[] = [
  { layout: "STAKES", statement: "The caller hears you're booked. The agent never gets the showing." },
  { layout: "CONTRAST", before: "If the voice sounds human, the booking works.", after: "It works only if it lands in the calendar." },
  { layout: "POINT", title: "Confirm only after the calendar write succeeds", body: "Not when the caller says yes." },
  { layout: "STEP", title: "Start with after-hours calls only" },
  { layout: "STEP", title: "Then the main line" },
  { layout: "CHECKLIST", title: "Before you switch it on", items: ["Test ten bookings", "Watch the calendar", "Keep a human fallback"] },
  { layout: "NUMBER", value: "3", unit: "seconds", caption: "A silent timeout lost the booking." },
  { layout: "QUOTE", quote: "The model was fine. The calendar write failed." },
  { layout: "GRID", title: "What the agent must touch", items: [{ label: "Calendar", icon: "CALENDAR_BLANK" }, { label: "CRM record", icon: "DATABASE" }, { label: "Lead score", icon: "TARGET" }, { label: "Follow-up", icon: "CLOCK" }] },
  { layout: "PUNCH", lines: ["Voice sounds human.", "Booking says yes.", "Calendar stays empty."], checks: ["Write before you confirm", "Alert a human on failure"] },
  { layout: "CLOSE", takeaway: "Judge a voice agent by the calendar.", saveLine: "Save this for your next demo." },
];

describe("slide copy", () => {
  it("sets typographic quotes and apostrophes", () => {
    expect(smartQuotes(`The caller hears "you're booked".`)).toBe("The caller hears “you’re booked”.");
    expect(smartQuotes("'Early' signal")).toBe("‘Early’ signal");
  });
});

describe("slide layouts", () => {
  it("fits every layout, and the cover is slide 1", () => {
    const d = deck(EVERY_LAYOUT);
    for (let i = 0; i <= d.slides.length; i++) expect(() => slideElement(d, i)).not.toThrow();
    expect(() => slideElement(d, d.slides.length + 1)).toThrow(RangeError);
  });

  it("fits every layout in every style", () => {
    for (const style of SLIDE_STYLES) {
      const d = { ...deck(EVERY_LAYOUT), style };
      for (let i = 1; i <= d.slides.length; i++) expect(() => slideElement(d, i), `${style} slide ${i + 1}`).not.toThrow();
    }
  });

  it("draws an icon under short words, and drops it rather than fail when the words need the room", () => {
    const images = (d: Deck) => JSON.stringify(slideElement(d, 1)).split("data:image/svg+xml").length - 1;
    const plain = images(deck([{ layout: "POINT", title: "Write the context down" }]));
    expect(images(deck([{ layout: "POINT", title: "Write the context down", icon: "NOTEBOOK" }]))).toBe(plain + 1);
    const long = "Write down every architecture decision, every edge case and the one integration only they understood, before they leave";
    const body = "The context that was never written down leaves with them, and the roadmap slips.";
    expect(images(deck([{ layout: "POINT", title: long, body, icon: "NOTEBOOK" }]))).toBe(plain);
    // Fits beside the icon, but only by shrinking the headline well below its size without it.
    const statement = "A full redesign is usually the most expensive way to avoid fixing your homepage messaging.";
    const stakes = (icon?: "WARNING") => deck([{ layout: "STAKES", statement, body: "Founders ask for a rebuild when the real problem is where visitors drop off.", icon }]);
    expect(images(stakes("WARNING"))).toBe(images(stakes()));
  });

  it("rejects copy that cannot fit rather than cutting it", () => {
    const long = Array(80).fill("booking").join(" ");
    expect(() => slideElement(deck([{ layout: "POINT", title: long }]), 1)).toThrow(CoverFitError);
    expect(() => slideElement(deck([{ layout: "CLOSE", takeaway: long }]), 1)).toThrow(CoverFitError);
  });

  it("takes 3 to 6 grid tiles and 3 or 4 punch lines", () => {
    const grid = (n: number) => deck([{ layout: "GRID", title: "Parts", items: Array.from({ length: n }, (_, i) => ({ label: `Part ${i + 1}`, icon: "GEAR" as const })) }]);
    expect(() => slideElement(grid(2), 1)).toThrow(CoverFitError);
    expect(() => slideElement(grid(6), 1)).not.toThrow();
    expect(() => slideElement(grid(7), 1)).toThrow(CoverFitError);
    const punch = (n: number) => deck([{ layout: "PUNCH", lines: Array.from({ length: n }, (_, i) => `Line ${i + 1}.`), checks: ["One check"] }]);
    expect(() => slideElement(punch(2), 1)).toThrow(CoverFitError);
    expect(() => slideElement(punch(4), 1)).not.toThrow();
    expect(() => slideElement(punch(5), 1)).toThrow(CoverFitError);
  });

  it("POSTER pages take turns dark and light, and the ribbon runs across them", () => {
    const d: Deck = { ...deck(EVERY_LAYOUT), style: "POSTER" };
    const bg = (i: number) => (slideElement(d, i).props as { style: { background: string } }).style.background;
    expect(bg(1)).toBe(brand.ink);
    expect(bg(2)).toBe(brand.paper);
    expect(bg(3)).toBe(brand.ink);
    // Each page shows its own slice of one wide drawing.
    const slice = (i: number) => JSON.stringify(slideElement(d, i)).match(/"data-slice":"(\d+)"/)?.[1];
    expect(slice(1)).toBe("1080");
    expect(slice(2)).toBe("2160");
  });

  it("AURORA is dark throughout and slices one deck-wide drawing; SWISS closes dark; BENTO stays light", () => {
    const bg = (style: Deck["style"], i: number) => (slideElement({ ...deck(EVERY_LAYOUT), style }, i).props as { style: { background: string } }).style.background;
    const last = EVERY_LAYOUT.length;
    for (let i = 1; i <= last; i++) {
      expect(bg("AURORA", i)).toBe(brand.ink);
      expect(bg("BENTO", i)).not.toBe(brand.ink);
    }
    expect(bg("SWISS", 1)).toBe(brand.paper);
    expect(bg("SWISS", last)).toBe(brand.ink);
    const slice = (i: number) => JSON.stringify(slideElement({ ...deck(EVERY_LAYOUT), style: "AURORA" }, i)).match(/"data-slice":"(\d+)"/)?.[1];
    expect(slice(1)).toBe("1080");
    expect(slice(3)).toBe("3240");
  });

  it("takes 2 to 5 checklist items", () => {
    const list = (n: number) => deck([{ layout: "CHECKLIST", title: "Checks", items: Array.from({ length: n }, (_, i) => `Check ${i + 1}`) }]);
    expect(() => slideElement(list(1), 1)).toThrow(CoverFitError);
    expect(() => slideElement(list(5), 1)).not.toThrow();
    expect(() => slideElement(list(6), 1)).toThrow(CoverFitError);
  });
});

describe("carousel PDF", () => {
  it("has one page per slide at the slide size", async () => {
    const d = deck(EVERY_LAYOUT.slice(0, 3));
    const pdf = await PDFDocument.load(await renderCarouselPdf(d));
    expect(pdf.getPageCount()).toBe(4);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 1080, height: 1350 });
    expect(pdf.getTitle()).toBe(d.cover.headline);
  }, 60_000);

  it("fails the whole deck before drawing when one slide cannot fit", async () => {
    const d = deck([...EVERY_LAYOUT.slice(0, 2), { layout: "POINT", title: Array(80).fill("word").join(" ") }]);
    await expect(renderCarouselPdf(d)).rejects.toThrow(CoverFitError);
  });
});
