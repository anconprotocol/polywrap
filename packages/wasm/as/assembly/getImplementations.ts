import {
  Read,
  ReadDecoder
} from "./msgpack";

// Get Implementations API
@external("w3", "__w3_get_implementations")
export declare function __w3_get_implementations(
  uri_ptr: u32, uri_len: u32
): bool;

// Get Implementations Result
@external("w3", "__w3_get_implementations_result_len")
export declare function __w3_get_implementations_result_len(): u32;
@external("w3", "__w3_get_implementations_result")
export declare function __w3_get_implementations_result(ptr: u32): void;

// Get Implementations Error
@external("w3", "__w3_get_implementations_error_len")
export declare function __w3_get_implementations_error_len(): u32;
@external("w3", "__w3_get_implementations_error")
export declare function __w3_get_implementations_error(ptr: u32): void;

export function w3_getImplementations(uri: string): string[] {
  const uriBuf = String.UTF8.encode(uri);
  const success = __w3_get_implementations(
    changetype<u32>(uriBuf),
    uriBuf.byteLength
  );

  if (!success) {
    const errorLen = __w3_get_implementations_error_len();
    const messageBuf = new ArrayBuffer(changetype<u32>(errorLen));
    __w3_get_implementations_error(changetype<u32>(messageBuf));
    const message = String.UTF8.decode(messageBuf);
    throw new Error(message);
  }

  const resultLen = __w3_get_implementations_result_len();
  const resultBuf = new ArrayBuffer(resultLen);
  __w3_get_implementations_result(changetype<u32>(resultBuf));

  // Decode the msgpack buffer
  const decoder = new ReadDecoder(resultBuf);
  const result: string[] = [];

  decoder.readArray((reader: Read) => {
    const item = reader.readString()
    result.push(item);
  });

  return result;
}
