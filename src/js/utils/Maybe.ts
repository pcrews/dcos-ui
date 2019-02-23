/*
  `Maybe` can help you with optional arguments, error handling, and records
  with optional fields.

  N.B. we're not using a curried last-arg-style, as typescript is not yet able
  to infer the types for generic type variables then. Instead it actually lies
  about the type to be infered being "{}". See
  https://github.com/Microsoft/TypeScript/issues/9366 and
  https://github.com/Microsoft/TypeScript/pull/24626.
*/

///////////////////////////////////////////////////////////////////////////////
//                           TYPES AND CONSTRUCTORS                          //
///////////////////////////////////////////////////////////////////////////////

/*
  Represent values that may or may not exist. It can be useful if you have a
  field that is only filled in sometimes. Or if a function takes a value
  sometimes, but does not absolutely need it.

      type Person = {
        name: string;
        age: Maybe<number>;
      }

      const sue = { name: "Sue", age: Nothing }
      const tom = { name: "Tom", age: Just(42) }

 */
type Maybe<Value> = Just<Value> | Nothing;

interface Nothing {
  readonly tag: "Nothing";
}

interface Just<T> {
  readonly tag: "Just";
  readonly value: T;
}

const Just = <Value>(value: Value): Maybe<Value> => ({ tag: "Just", value });

const Nothing: Nothing = { tag: "Nothing" };

///////////////////////////////////////////////////////////////////////////////
//                                 FUNCTIONS                                 //
///////////////////////////////////////////////////////////////////////////////

/*
  Convenience function to turn a value that might be undefined into a maybe.

      const unsafeResult = ["muffins", "chocolate"].find(a => a == "cake")
      const maybeCake = Maybe.fromValue(unsafeResult)
      // typeof maybeCake === Maybe<string>

*/
type fromValue = <A>(value: A | undefined) => Maybe<A>;
const fromValue: fromValue = value =>
  value !== undefined ? Just(value) : Nothing;

/*
  Transform a `Maybe` value with a given function:

      Maybe.map(Just(9), Math.sqrt) === Just(3)
      Maybe.map(Just("hallo"), string => string.length) === Just(5)

*/

type map = <A, B>(maybe: Maybe<A>, fn: (value: A) => B) => Maybe<B>;
const map: map = (maybe, fn) => {
  switch (maybe.tag) {
    case "Just":
      return Just(fn(maybe.value));
    case "Nothing":
      return Nothing;
  }
};

/*
  Provide a default value, turning an optional value into a normal
  value.

      import { pipe } from "rxjs"

      const ageInWords: (age: Maybe<number>) => string =
        pipe(
          _ => Maybe.map(_, age => `is ${age} years old`),
          _ => Maybe.withDefault(_, "unknown")
        )
      }

*/
type withDefault = <A>(maybe: Maybe<A>, defaultValue: A) => A;
const withDefault: withDefault = (maybe, defaultValue) => {
  switch (maybe.tag) {
    case "Just":
      return maybe.value;

    case "Nothing":
      return defaultValue;
  }
};

/*
  A convenience function to fold (or unpack) a Maybe.

      Maybe.fold(person.age, {
        Just: x =>
          <Person age={x} />
        Nothing:
          <FillYourProfileNag />
      })

*/
type fold = <A, R>(maybe: Maybe<A>, o: { Just: (a: A) => R; Nothing: R }) => R;
const fold: fold = (maybe, { Just: onJust, Nothing: onNothing }) => {
  switch (maybe.tag) {
    case "Just":
      return onJust(maybe.value);

    case "Nothing":
      return onNothing;
  }
};

/*
  Chain together computations that may fail. It is helpful to see its
  definition:

      const andThen: andThen = (maybe, callback) => {
        switch (maybe.tag) {
          case "Just":    return callback(maybe.value);
          case "Nothing": return Nothing;
        }
      }

  We only continue with the callback if things are going well. For
  example, say you need to get entries in an array based on the value of
  indices of other arrays:

      const arrayOne = [2, 0, 1];
      const arrayTwo = [0, 1];
      const arrayThree = [42];

      type getIndex = (array: string[]) => (index: number) => Maybe<string>
      const getIndex : getIndex = array => index => {
        const value = array[index]
        return value ? Just(value) : Nothing
      }

      import { pipe } from 'rxjs'
      const computeValue = pipe(
        _ => Maybe.andThen(_, getIndex(arrayOne)),
        _ => Maybe.andThen(_, getIndex(arrayTwo)),
        _ => Maybe.andThen(_, getIndex(arrayThree))
      )

      console.log(computeValue(Just(1))) // => Just 42
          // it is given Just(1)
          // andThen it retrieves the 1st index of arrayOne => 0
          // andThen it retrieves the 0th index of arrayTwo => 0
          // andThen it retrieves the 0th index of arrayThree => 42

      console.log(computeValue(Just(0))) // => Nothing
          // it is given Just(0)
          // andThen it retrieves the 0th index of arrayOne => 2
          // andThen it retrieves the 1st index of arrayTwo => Nothing
          // next steps are omitted and Nothing is returned immediately.

  If any operation in the chain fails, the computation will short-circuit and
  result `Nothing`. This may come in handy if we wanted to skip e.g. some
  network requests.
*/
type andThen = <A, B>(maybe: Maybe<A>, fn: (v: A) => Maybe<B>) => Maybe<B>;
const andThen: andThen = (maybe, callback) => {
  switch (maybe.tag) {
    case "Just":
      return callback(maybe.value);
    case "Nothing":
      return Nothing;
  }
};

// Exporting only the type contructors and a `Maybe` bundling the functions,
// so application code is nudged to use the functions fully qualified.
const Maybe = {
  andThen,
  fold,
  fromValue,
  map,
  withDefault
};
export { Just, Nothing, Maybe };
