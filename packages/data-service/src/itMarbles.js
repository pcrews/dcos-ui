import { marbles } from "rxjs-marbles/jest";

const itMarbles = (title, test) =>
  it(
    title,
    marbles(m => {
      m.bind();
      test(m);
    })
  );

itMarbles.only = (title, test) =>
  it.only(
    title,
    marbles(m => {
      m.bind();
      test(m);
    })
  );

export default itMarbles;
