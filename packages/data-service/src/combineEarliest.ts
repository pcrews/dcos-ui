import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/filter";
import "rxjs/add/observable/of";

interface ObservableMap {
  [key: string]: Observable<any>;
}
type ObservableArray = Array<Observable<any>>;

function isNotAnEmptyObject(value: object): boolean {
  return !(Object.keys(value).length === 0);
}

function combineObjects(value1: object, value2: object): object {
  return { ...value1, ...value2 };
}

function objectWithKey(obs$: Observable<any>, key: string): Observable<object> {
  return obs$.map(value => ({ [key]: value }));
}

// TODO: use conditional type for return?
export default function combineEarliest<
  T extends ObservableMap | ObservableArray
>(values: T): Observable<object> | Observable<any[]> {
  const namedValueStream = Object.entries(values)
    .map(([key, value$]) => objectWithKey(value$, key))
    .reduce((carry, item) => carry.merge(item), Observable.of({}));

  return namedValueStream.scan(combineObjects).filter(isNotAnEmptyObject);
}
