import { Maybe, Just, Nothing } from "../Maybe";

describe("Maybe", () => {
  describe("#andThen", () => {
    it("chains", () => {
      expect(Maybe.andThen(Just(1), x => Just(x))).toEqual(Just(1));
    });

    it("short-circuits", () => {
      const fn = jest.fn(x => x);

      expect(Maybe.andThen(Nothing, fn)).toEqual(Nothing);
      expect(fn.mock.calls.length).toBe(0);
    });
  });

  describe("#fromValue", () => {
    it("turns `A | undefined` into Maybe<A>", () => {
      const test = [1, 2].find(Number.isInteger);

      expect(Maybe.fromValue(test)).toEqual(Just(1));
    });
  });

  describe("#map", () => {
    it("maps", () => {
      expect(Maybe.map(Just(1), x => x + 1)).toEqual(Just(2));
    });

    it("does not map Nothing", () => {
      expect(Maybe.map(Nothing, _ => true)).toEqual(Nothing);
    });
  });

  describe("#withDefault", () => {
    it("provides a default value for Nothing", () => {
      expect(Maybe.withDefault(Nothing, 42)).toBe(42);
    });

    it("unwraps the value in Just", () => {
      expect(Maybe.withDefault(Just(1), 42)).toBe(1);
    });
  });

  describe("#fold", () => {
    it("folds", () => {
      expect(
        Maybe.fold(Just(1), {
          Just: x => x + 1,
          Nothing: 42
        })
      ).toBe(2);
    });
  });
});
