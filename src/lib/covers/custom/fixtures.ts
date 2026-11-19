/** A template that satisfies the whole contract; tests mutate it. Not shipped to users. */
export const GOOD_TEMPLATE = `<div data-cover-template="1" data-name="Soft Blue" style="display:flex;flex-direction:column;justify-content:space-between;width:1080px;height:1350px;padding:88px;background-color:var(--paper);overflow:hidden">
  <div data-if="label" style="display:flex;background-color:var(--ink);border-radius:999px;padding:10px 24px">
    <div data-fit data-max-lines="1" data-min-size="30" data-max-size="34" style="width:600px;font-family:'Plus Jakarta Sans';font-weight:600;color:var(--paper)">{{label}}</div>
  </div>
  <div style="display:flex;flex-direction:column">
    <div data-fit data-max-lines="3" data-min-size="48" data-max-size="120" data-emphasis-color="accent" style="width:900px;font-family:'Bricolage Grotesque';font-weight:800;line-height:1.05;color:var(--ink)">{{headline}}</div>
    <div data-if="kicker" style="display:flex;margin-top:32px">
      <div data-fit data-max-lines="2" data-min-size="30" data-max-size="40" style="width:900px;font-family:'Plus Jakarta Sans';color:var(--secondary)">{{kicker}}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center">
    <div data-if="photo" style="display:flex;margin-right:24px"><img src="{{photo}}" width="120" height="120" style="object-fit:cover;border-radius:999px" /></div>
    <div style="display:flex;flex-direction:column">
      <div data-fit data-max-lines="1" data-min-size="30" data-max-size="40" style="width:700px;font-family:'Plus Jakarta Sans';font-weight:600;color:var(--ink)">{{author_name}}</div>
      <div data-if="author_role" style="display:flex">
        <div data-fit data-max-lines="1" data-min-size="30" data-max-size="32" style="width:700px;font-family:'Plus Jakarta Sans';color:var(--secondary)">{{author_role}}</div>
      </div>
    </div>
    <svg width="64" height="64" viewBox="0 0 64 64" style="margin-left:auto"><circle cx="32" cy="32" r="28" fill="var(--accent)"/><path d="M20 32 L44 32" stroke="#fff" stroke-width="4"/></svg>
  </div>
</div>`;
