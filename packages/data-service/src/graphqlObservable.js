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
    const currentType = getChildType(type, definition);

    if (definition.kind === "OperationDefinition") {
      return resolveOperation(definition, context, null, currentType);
    }

    if (definition.kind === "Field") {
      const args = buildResolveArgs(definition, context);
      let resolvedObservable;

      // TODO: extract into own function with early returns?
      if (currentType && currentType.resolve instanceof Function) {
        resolvedObservable = currentType.resolve(
          parent,
          args,
          context,
          null // that would be the info
        );
      } else {
        const fieldsOfType = type.getFields();
        const fieldName = definition.name.value;
        const fieldDefinition = fieldsOfType[fieldName];

        if (fieldDefinition && fieldDefinition.resolve instanceof Function) {
          resolvedObservable = fieldDefinition.resolve(
            parent,
            args,
            context,
            null // that would be the info
          );
        } else if (definition.selectionSet !== undefined) {
          resolvedObservable = Observable.of(parent); // TODO: this hints that we are not standard conform for nested normal resolvers
        } else {
          resolvedObservable = Observable.of(parent[fieldName]);
        }
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

        if (emitted instanceof Array) {
          return resolveArrayResults(definition, context, emitted, currentType);
        }

        return resolveResult(definition, context, emitted, currentType);
      });
    }

    // if (definition.kind === "Field" && definition.selectionSet !== undefined) {
    //   return resolveNode(definition, context, parent, type);
    // }

    // if (definition.kind === "Field") {
    //   return resolveLeaf(definition, context, parent, type);
    // }

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
      const resultObserver = resolveResult(definition, context, result, type);

      return acc.combineLatest(resultObserver, listAppend);
    }, Observable.of([]));
  }

  function getChildType(parentType, definition) {
    const translateOperation = {
      query: "Query",
      mutation: "Mutation"
    };

    // Operation is given (query or mutation), returns a type
    if (parentType === null && definition.operation) {
      return types[translateOperation[definition.operation]];
    }

    // Field on a type is given, returns the type of the fields value
    if (
      parentType !== null &&
      parentType.getFields instanceof Function &&
      parentType.getFields()[definition.name.value]
    ) {
      return getNamedType(parentType.getFields()[definition.name.value].type);
    }

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
