import combineEarliest from "../combineEarliest";
import itMarbles from "../itMarbles";

describe("combineEarliest", () => {
  itMarbles("combines an object of streams", m => {
    const a$ = m.cold("-a", {
      a: 23
    });

    const b$ = m.cold("------b", {
      b: 42
    });

    const combined$ = combineEarliest({
      a: a$,
      b: b$
    });

    const expected$ = m.cold("-x----y", {
      x: { a: 23 },
      y: { a: 23, b: 42 }
    });

    m.expect(combined$).toBeObservable(expected$);
  });

  itMarbles("finishes when all streams are done", m => {
    const a$ = m.cold("-a|", {
      a: 23
    });

    const b$ = m.cold("------b|", {
      b: 42
    });
    const c$ = m.cold("--------c--|", {
      c: "yes, I see"
    });

    const combined$ = combineEarliest({
      a: a$,
      b: b$,
      c: c$
    });

    const expected$ = m.cold("-x----y-z--|", {
      x: { a: 23 },
      y: { a: 23, b: 42 },
      z: { a: 23, b: 42, c: "yes, I see" }
    });

    m.expect(combined$).toBeObservable(expected$);
  });

  itMarbles("combines two streams as array", m => {
    const a$ = m.cold("------a|", {
      a: 23
    });

    const b$ = m.cold("-b|", {
      b: 42
    });

    const combined$ = combineEarliest([a$, b$]);
    const expected$ = m.cold("-x----y|", {
      x: [undefined, 42],
      y: [23, 42]
    });

    m.expect(combined$).toBeObservable(expected$);
  });
});
