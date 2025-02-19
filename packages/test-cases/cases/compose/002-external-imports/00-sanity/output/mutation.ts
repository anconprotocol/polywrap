import {
  createMethodDefinition,
  createQueryDefinition,
  TypeInfo,
  createObjectPropertyDefinition,
  createImportedObjectDefinition,
  createScalarPropertyDefinition,
} from "@web3api/schema-parse";

export const typeInfo: TypeInfo = {
  objectTypes: [
  ],
  queryTypes: [
    {
      ...createQueryDefinition({ type: "Mutation" }),
      imports: [
        { type: "Namespace_ExternalType" }
      ],
      interfaces: [],
      methods: [
        {
          ...createMethodDefinition({
            type: "mutation",
            name: "method",
            return: createObjectPropertyDefinition({
              name: "method",
              type: "Namespace_ExternalType",
            }),
          }),
          arguments: [
          ],
        },
      ],
    },
  ],
  enumTypes: [],
  importedObjectTypes: [
    {
      ...createImportedObjectDefinition({
        uri: "external.eth",
        namespace: "Namespace",
        nativeType: "ExternalType",
        type: "Namespace_ExternalType"
      }),
      properties: [
        createScalarPropertyDefinition({
          name: "str",
          type: "String"
        })
      ],
    },
  ],
  importedQueryTypes: [],
  importedEnumTypes: [],
  interfaceTypes: [],
};
