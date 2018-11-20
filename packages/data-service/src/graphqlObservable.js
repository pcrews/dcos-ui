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
    console.log(
      "Resolving",
      definition.kind === "OperationDefinition"
        ? definition.operation
        : definition.name.value
    );
    const currentType = getChildType(type, definition, parent);
    console.log("ParentType:", type);
    console.log("Type:", currentType);
    console.log("Parent:", parent);

    if (definition.kind === "OperationDefinition") {
      return resolveOperation(definition, context, null, currentType);
    }

    if (definition.kind === "Field") {
      console.log("Me is field");
      const args = buildResolveArgs(definition, context);
      const fieldName = definition.name.value;
      const fieldsOfType = type.getFields();
      const fieldDefinition = fieldsOfType[fieldName];
      let resolvedObservable;

      // TODO: extract into own function with early returns?
      if (fieldDefinition && fieldDefinition.resolve instanceof Function) {
        console.log("Executing resolve function");
        resolvedObservable = fieldDefinition.resolve(
          parent,
          args,
          context,
          null // that would be the info
        );
      } else {
        console.log("resolving parent[fieldName]");
        resolvedObservable = Observable.of(parent[fieldName]);
      }

      if (!resolvedObservable) {
        return throwObservable("resolver returns empty value");
      }

      if (!(resolvedObservable instanceof Observable)) {
        return throwObservable("resolver does not return an observable");
      }

      // Directly return the leaf nodes
      if (definition.selectionSet === undefined) {
        return resolvedObservable;
      }

      return resolvedObservable.concatMap(emitted => {
        if (!emitted) {
          return throwObservable("resolver emitted empty value");
        }
        console.log("sth was emitted", emitted);

        if (emitted instanceof Array) {
          console.log("resolving the array");

          return resolveArrayResults(definition, context, emitted, currentType);
        }

        return resolveResult(definition, context, emitted, currentType);
      });
    }

    return throwObservable(`kind not supported "${definition.kind}".`);
  }

  // TODO: remove?
  function resolveOperation(definition, context, parent, type) {
    return resolveResult(definition, context, parent, type);
  }

  // Goes one level deeper into the query nesting
  function resolveResult(definition, context, parent, type) {
    return definition.selectionSet.selections.reduce((acc, sel) => {
      const result = resolve(sel, context, parent, type);
      const fieldName = (sel.alias || sel.name).value;

      return acc.combineLatest(result, objectAppendWithKey(fieldName));
    }, Observable.of({}));
  }

  function resolveArrayResults(definition, context, parents, type) {
    return parents.reduce((acc, result) => {
      console.log("calling resolveResult with ", { result, parents });
      const resultObserver = resolveResult(definition, context, result, type);

      return acc.combineLatest(resultObserver, listAppend);
    }, Observable.of([]));
  }

  function getChildType(parentType, definition, parent) {
    const translateOperation = {
      query: "Query",
      mutation: "Mutation"
    };

    // TODO: seperate type and field here, it seems interchanged

    // Operation is given (query or mutation), returns a type
    if (parentType === null && definition.operation) {
      return types[translateOperation[definition.operation]];
    }

    // See if we need to use a type resolver
    if (parentType !== null && parentType.resolveType instanceof Function) {
      console.log("resolveType route");
      // TODO: Not GraphQL spec compliant (should also have context and info)
      const type = parentType.resolveType(parent);

      return getNamedType(type.getFields()[definition.name.value]);
    }

    // Types are given with access to the requested field, so get type of resolved field
    if (
      parentType !== null &&
      parentType.getFields instanceof Function &&
      parentType.getFields()[definition.name.value]
    ) {
      console.log("field on type route");

      return getNamedType(parentType.getFields()[definition.name.value].type);
    }

    console.log("default route", definition.name.value);
    // Access to a globally known type, returns a tyoe
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
