import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/of";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/concatMap";

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

  const nextTypeMap = types[
    translateOperation[definition.operation]
  ].getFields();

  // TODO: separate current types and all types
  return resolveResult(null, { ...types, ...nextTypeMap }, definition, context);
}

function resolveNode(types, definition, context, parent) {
  const args = buildResolveArgs(definition, context);
  const resolver = types[definition.name.value];

  console.log({ resolver, types, definition });
  if (!resolver) {
    return throwObservable(`missing resolver for ${definition.name.value}`);
  }

  const resolvedObservable = resolver.resolve(
    parent,
    args,
    context,
    null // that would be the info
  );

  if (!resolvedObservable) {
    return throwObservable("resolver returns empty value");
  }

  if (!(resolvedObservable instanceof Observable)) {
    return throwObservable("resolver does not return an observable");
  }

  const resolvedType = resolver.type.ofType.name
    ? resolver.type.ofType.name
    : resolver.type.ofType.ofType.name;

  console.count(resolvedType);
  const whatever = types[resolvedType]._fields;
  // TODO: this puts type into our main type map that are field resolvers, we should have another list for them
  const newTypes = { ...types, ...whatever };

  return resolvedObservable.concatMap(emitted => {
    // TODO: change these types to resemble
    // See: https://facebook.github.io/graphql/June2018/#ResolveFieldValue()
    // ResolveFieldValue(objectValue, argumentValues)
    // objectValue: whatever the endpoint gives you
    // argumentValues: unclear in the spec, would assume it's the last args given to the system
    const resolverArgs = [emitted, newTypes, definition, context, resolver];
    if (!emitted) {
      return throwObservable("resolver emitted empty value");
    }

    if (emitted instanceof Array) {
      return resolveArrayResults(...resolverArgs);
    }

    return resolveResult(...resolverArgs);
  });
}

function resolveLeaf(types, definition, context, parent) {
  return Observable.of(parent[definition.name.value]);
}

function resolveResult(parent, types, definition, context, resolver) {
  return definition.selectionSet.selections.reduce((acc, sel) => {
    const refinedTypes = refineTypes(resolver, parent, types);
    const result = resolve(refinedTypes, sel, context, parent);
    const fieldName = (sel.alias || sel.name).value;

    return acc.combineLatest(result, objectAppendWithKey(fieldName));
  }, Observable.of({}));
}

function resolveArrayResults(parents, types, definition, context, resolver) {
  return parents.reduce((acc, result) => {
    const resultObserver = resolveResult(
      result,
      types,
      definition,
      context,
      resolver
    );

    return acc.combineLatest(resultObserver, listAppend);
  }, Observable.of([]));
}

function buildResolveArgs(definition, context) {
  return definition.arguments
    .map(arg => {
      return arg.value.kind === "Variable"
        ? { [arg.name.value]: context[arg.value.name.value] }
        : { [arg.name.value]: arg.value.value };
    })
    .reduce(Object.assign, {});
}

function refineTypes(resolver, parent, types) {
  console.log("RefineTypes");
  console.log({ resolver, parent, types });

  return resolver && resolver.type.resolveType
    ? resolver.type.resolveType(parent).getFields()
    : types;
}

const objectAppendWithKey = key => {
  return (destination, source) => ({ ...destination, [key]: source });
};

const listAppend = (destination, source) => {
  return destination.concat(source);
};
