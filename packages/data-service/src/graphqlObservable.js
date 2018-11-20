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
  const types = schema._typeMap;

  function resolve(definition, context, parent, type) {
    if (definition.kind === "OperationDefinition") {
      return resolveOperation(definition, context);
    }

    if (definition.kind === "Field" && definition.selectionSet !== undefined) {
      return resolveNode(definition, context, parent, type);
    }

    if (definition.kind === "Field") {
      return resolveLeaf(definition, context, parent, type);
    }

    return throwObservable(`kind not supported "${definition.kind}".`);
  }

  function resolveOperation(definition, context) {
    return resolveResult(
      definition,
      context,
      null,
      getChildType(null, definition)
    );
  }

  function resolveNode(definition, context, parent, type) {
    const args = buildResolveArgs(definition, context);

    console.log({ definition, context, parent, type });
    const resolvedObservable = type.resolve
      ? type.resolve(
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
        return resolveArrayResults(definition, context, emitted, type);
      }

      return resolveResult(definition, context, emitted, type);
    });
  }

  function resolveLeaf(definition, context, parent, type) {
    const name = definition.name.value;

    // const args = buildResolveArgs(definition, context);
    // const type = types[name];

    return Observable.of(parent[name]);
    // return type && type.resolve
    //   ? type.resolve(parent, args, context)
    //   : Observable.of(parent[name]);
  }

  function resolveResult(definition, context, parent, type) {
    return definition.selectionSet.selections.reduce((acc, sel) => {
      // Get the child type for a the current selection
      const childType = getChildType(type, sel);
      const result = resolve(sel, context, parent, childType);
      const fieldName = (sel.alias || sel.name).value;

      return acc.combineLatest(result, objectAppendWithKey(fieldName));
    }, Observable.of({}));
  }

  function resolveArrayResults(definition, context, parents, type) {
    return parents.reduce((acc, result) => {
      const resultObserver = resolveResult(definition, context, result, type);

      return acc.combineLatest(resultObserver, listAppend);
    }, Observable.of([]));
  }

  function getChildType(parentType, definition) {
    console.log("ChildType for", { parentType, definition });
    const translateOperation = {
      query: "Query",
      mutation: "Mutation"
    };

    // Operation is given (query or mutation)
    if (parentType === null && definition.operation) {
      return types[translateOperation[definition.operation]];
    }

    const parentTypeFields =
      parentType.getFields instanceof Function ? parentType.getFields() : {};

    // Field on a type is given
    if (parentType !== null && parentTypeFields[definition.name.value]) {
      return parentTypeFields[definition.name.value];
    }

    // Access to a globally known type
    const currentType = types[definition.name.value];

    return currentType && currentType.type
      ? getNamedType(currentType.type)
      : null;
  }

  return resolve(doc.definitions[0], context, null, null).map(data => ({
    data
  }));
}

function throwObservable(error) {
  const graphqlErrorMessage = `graphqlObservable error: ${error}`;
  const graphqlError = new Error(graphqlErrorMessage);

  return Observable.throw(graphqlError);
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

const objectAppendWithKey = key => {
  return (destination, source) => ({ ...destination, [key]: source });
};

const listAppend = (destination, source) => {
  return destination.concat(source);
};
