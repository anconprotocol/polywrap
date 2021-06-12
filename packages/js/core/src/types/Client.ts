import { QueryHandler, InvokeHandler } from "./";

export interface Client extends QueryHandler, InvokeHandler {}
  getImplementations(uri: string, filters?: { applyRedirects: boolean }): string[];
