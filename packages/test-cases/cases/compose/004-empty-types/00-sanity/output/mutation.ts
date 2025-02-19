import {
  createQueryDefinition,
  createObjectDefinition,
  TypeInfo,
} from "@web3api/schema-parse";

export const typeInfo: TypeInfo = {
  objectTypes: [
    {
      ...createObjectDefinition({
        type: "CustomType",
      }),
      properties: [
      ],
    },
  ],
  queryTypes: [
    {
      ...createQueryDefinition({ type: "Mutation" }),
      imports: [],
      interfaces: [],
      methods: [
      ],
    },
  ],
  enumTypes: [],
  importedObjectTypes: [],
  importedQueryTypes: [],
  importedEnumTypes: [],
  interfaceTypes: [],
};
