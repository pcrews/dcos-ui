import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/of";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/concatMap";
import { getNamedType } from "graphql";

// TODO: add types with typescript

// WARNING: This is NOT a spec complete graphql implementation
// https://facebook.github.io/graphql/October2016/

// eslint-disable-next-line import/prefer-default-export
export function graphqlObservable(doc, schema, context) {
  if (doc.definitions.length !== 1) {
    return throwObservable("document root must have a single definition");
  }

  return resolve(schema._typeMap, doc.definitions[0], context, null).map(
    data => ({ data })
  );
}

function throwObservable(error) {
  const graphqlErrorMessage = `graphqlObservable error: ${error}`;
  const graphqlError = new Error(graphqlErrorMessage);

  return Observable.throw(graphqlError);
}

function resolve(types, definition, context, parent) {
  if (definition.kind === "OperationDefinition") {
    return resolveOperation(types, definition, context);
  }

  if (definition.kind === "Field" && definition.selectionSet !== undefined) {
    return resolveNode(types, definition, context, parent);
  }

  if (definition.kind === "Field") {
    return resolveLeaf(types, definition, context, parent);
  }

  return throwObservable(`kind not supported "${definition.kind}".`);
}

function resolveOperation(types, definition, context) {
  const translateOperation = {
    query: "Query",
    mutation: "Mutation"
  };

  console.log("resolveOp", definition);
  const nextTypeMap = types[
    translateOperation[definition.operation]
  ].getFields();

  return resolveResult(null, { ...nextTypeMap, ...types }, definition, context);
}

function resolveNode(types, definition, context, parent) {
  const args = buildResolveArgs(definition, context);
  const currentType = types[definition.name.value];
  console.log("Def", definition);

  if (!currentType) {
    return throwObservable(`missing resolver for ${definition.name.value}`);
  }

  console.log("R", currentType);
  const resolvedObservable = currentType.resolve
    ? currentType.resolve(
        parent,
        args,
        context,
        null // that would be the info
      )
    : Observable.of(parent);

  if (!resolvedObservable) {
    return throwObservable("resolver returns empty value");
  }

  if (!(resolvedObservable instanceof Observable)) {
    return throwObservable("resolver does not return an observable");
  }

  return resolvedObservable.concatMap(emitted => {
    if (!emitted) {
      return throwObservable("resolver emitted empty value");
    }

    if (emitted instanceof Array) {
      return resolveArrayResults(
        emitted,
        types,
        definition,
        context,
        currentType
      );
    }

    return resolveResult(emitted, types, definition, context, currentType);
  });
}

function resolveLeaf(types, definition, context, parent) {
  const args = buildResolveArgs(definition, context);
  const name = definition.name.value;
  const type = types[name];

  return type && type.resolve
    ? type.resolve(parent, args, context)
    : Observable.of(parent[name]);
}

function resolveResult(parent, types, definition, context, currentType) {
  return definition.selectionSet.selections.reduce((acc, sel) => {
    const refinedTypes = refineTypes(currentType, types);
    const result = resolve(refinedTypes, sel, context, parent);
    const fieldName = (sel.alias || sel.name).value;

    return acc.combineLatest(result, objectAppendWithKey(fieldName));
  }, Observable.of({}));
}

function resolveArrayResults(parents, types, definition, context, currentType) {
  return parents.reduce((acc, result) => {
    const resultObserver = resolveResult(
      result,
      types,
      definition,
      context,
      currentType
    );

    return acc.combineLatest(resultObserver, listAppend);
  }, Observable.of([]));
}

function buildResolveArgs(definition, context) {
  return definition.arguments.reduce(
    (carry, arg) =>
      Object.assign(
        {},
        carry,
        arg.value.kind === "Variable"
          ? { [arg.name.value]: context[arg.value.name.value] }
          : { [arg.name.value]: arg.value.value }
      ),
    {}
  );
}

function refineTypes(currentType, types) {
  console.log("Resolver", currentType);

  return currentType && currentType.type
    ? { ...getNamedType(currentType.type).getFields(), types }
    : types;
}

const objectAppendWithKey = key => {
  return (destination, source) => ({ ...destination, [key]: source });
};

const listAppend = (destination, source) => {
  return destination.concat(source);
};
