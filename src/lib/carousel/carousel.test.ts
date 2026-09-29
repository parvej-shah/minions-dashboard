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
  });

  it("rejects copy that cannot fit rather than cutting it", () => {
    const long = Array(80).fill("booking").join(" ");
    expect(() => slideElement(deck([{ layout: "POINT", title: long }]), 1)).toThrow(CoverFitError);
    expect(() => slideElement(deck([{ layout: "CLOSE", takeaway: long }]), 1)).toThrow(CoverFitError);
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
