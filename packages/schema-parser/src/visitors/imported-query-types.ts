import {
  ArrayDefinition,
  PropertyDefinition,
  ScalarDefinition,
  TypeInfo,
  ImportedQueryTypeDefinition,
  MethodDefinition
} from "../types";

import {
  DocumentNode,
  ObjectTypeDefinitionNode,
  NonNullTypeNode,
  NamedTypeNode,
  ListTypeNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  visit,
  DirectiveNode,
  ValueNode
} from "graphql";

interface State {
  currentImport?: ImportedQueryTypeDefinition
  currentMethod?: MethodDefinition
  currentArgument?: PropertyDefinition
  currentReturn?: PropertyDefinition
  nonNullType?: boolean
}

const visitorEnter = (typeInfo: TypeInfo, state: State) => ({
  ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
    if (!node.directives) {
      return
    }

    // Look for imported
    const importedIndex = node.directives.findIndex(
      (dir: DirectiveNode) => dir.name.value === "imported"
    );

    if (importedIndex === -1) {
      return;
    }

    if (node.name.value !== "Query" && node.name.value !== "Mutation") {
      return;
    }

    const importedDir = node.directives[importedIndex];

    if (!importedDir.arguments || importedDir.arguments.length !== 3) {
      // TODO: Implement better error handling
      throw Error("Error: imported_type directive missing arguments");
    }

    let namespace: string | undefined;
    let uri: string | undefined;
    let type: string | undefined;

    const extractString = (value: ValueNode, name: string) => {
      if (value.kind === "StringValue") {
        return value.value;
      } else {
        throw Error(`Error: argument '${name}' must be a string`);
      }
    }

    for (const importArg of importedDir.arguments) {
      if (importArg.name.value === "namespace") {
        namespace = extractString(importArg.value, "namespace");
      } else if (importArg.name.value === "uri") {
        uri = extractString(importArg.value, "uri")
      } else if (importArg.name.value === "type") {
        type = extractString(importArg.value, "type")
      }
    }

    if (!type || !namespace || !uri) {
      throw Error("Error: import directive missing one of its required arguments (namespace, uri, type)");
    }

    const importedType = new ImportedQueryTypeDefinition(
      uri, namespace, node.name.value, type
    );
    typeInfo.importedQueryTypes.push(importedType);
    state.currentImport = importedType;
  },
  FieldDefinition: (node: FieldDefinitionNode) => {
    const importDef = state.currentImport;

    if (!importDef) {
      return;
    }

    if (!node.arguments || node.arguments.length === 0) {
      throw Error("Imported Query types must only have methods");
    }

    const operation = importDef.type === "Query" ? "query" : "mutation";
    const method = new MethodDefinition(
      operation, node.name.value
    );
    importDef.methods.push(method);
    state.currentMethod = method;
  },
  InputValueDefinition: (node: InputValueDefinitionNode) => {
    const method = state.currentMethod;

    if (!method) {
      return;
    }

    const argument = new PropertyDefinition(node.name.value);
    method.arguments.push(argument);
    state.currentArgument = argument;
  },
  NonNullType: (node: NonNullTypeNode) => {
    state.nonNullType = true;
  },
  NamedType: (node: NamedTypeNode) => {
    const argument = state.currentArgument;
    const method = state.currentMethod;
    const modifier = state.nonNullType ? "" : "?";

    if (method && argument) {
      // Argument value
      argument.scalar = new ScalarDefinition(
        argument.name, modifier + node.name.value, state.nonNullType
      );
      state.nonNullType = false;
    } else if (method) {
      // Return value
      if (!method.return) {
        method.return = new PropertyDefinition(
          method.name
        );
        state.currentReturn = method.return;
      } else if (!state.currentReturn) {
        state.currentReturn = method.return;
      }
      state.currentReturn.scalar = new ScalarDefinition(
        method.name, modifier + node.name.value, state.nonNullType
      );
      state.nonNullType = false;
    }
  },
  ListType: (node: ListTypeNode) => {
    const argument = state.currentArgument;
    const method = state.currentMethod;

    if (method && argument) {
      // Argument value
      argument.array = new ArrayDefinition(
        argument.name, "TBD", state.nonNullType
      );
      state.currentArgument = argument.array;
      state.nonNullType = false;
    } else if (method) {
      // Return value
      if (!method.return) {
        method.return = new PropertyDefinition(
          method.name
        );
        state.currentReturn = method.return;
      } else if (!state.currentReturn) {
        state.currentReturn = method.return;
      }

      state.currentReturn.array = new ArrayDefinition(
        method.name, "TBD", state.nonNullType
      );
      state.currentReturn = state.currentReturn.array;
      state.nonNullType = false;
    }
  },
});

const visitorLeave = (typeInfo: TypeInfo, state: State) => ({
  ObjectTypeDefinition: (node: ObjectTypeDefinitionNode) => {
    state.currentImport = undefined;
  },
  FieldDefinition: (node: FieldDefinitionNode) => {
    state.currentMethod = undefined;
    state.currentReturn = undefined;
  },
  InputValueDefinition: (node: InputValueDefinitionNode) => {
    state.currentArgument = undefined;
  },
  NonNullType: (node: NonNullTypeNode) => {
    state.nonNullType = false;
  },
});

export function visitImportedQueryTypes(astNode: DocumentNode, typeInfo: TypeInfo) {
  const state: State = { };

  visit(astNode, {
    enter: visitorEnter(typeInfo, state),
    leave: visitorLeave(typeInfo, state)
  });
}