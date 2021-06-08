// Get Implementations API

@external("w3", "__w3_get_implementations")
export declare function __w3_get_implementations(
  uri_ptr: u32, uri_len: u32
): bool;

// Get Implementations Result
@external("w3", "__w3_get_implementations_result_array_len")
export declare function __w3_get_implementations_result_array_len(): u32;
@external("w3", "__w3_get_implementations_result_item_len")
export declare function __w3_get_implementations_result_item_len(index: u32): u32;
@external("w3", "__w3_get_implementations_result_item")
export declare function __w3_get_implementations_result_item(index: u32, ptr: u32): void;

// Get Implementations Error
@external("w3", "__w3_get_implementations_error_len")
export declare function __w3_get_implementations_error_len(): u32;
@external("w3", "__w3_get_implementations_error")
export declare function __w3_get_implementations_error_len(ptr: u32): void;

export function w3_getImplementations(uri: string): string[] {
  const uriBuf = String.UTF8.encode(uri);
  const success = __w3_get_implementations(
    changetype<u32>(uriBuf),
    uriBuf.byteLength
  );

  if (!success) {
    const errorLen = __w3_get_implementations_error_len();
    const messageBuf = new ArrayBuffer(changetype<u32>(errorLen));
    __w3_get_implementations_error_len(changetype<u32>(messageBuf));
    const message = String.UTF8.decode(messageBuf);
    throw new Error(message);
  }

  const arrayLen = __w3_get_implementations_result_array_len();
  const result: string[] = [];

  for (let i: u32 = 0; i < arrayLen; ++i) {
    const strLen = __w3_get_implementations_result_item_len(i);
    const strBuf = new ArrayBuffer(changetype<u32>(strLen));
    __w3_get_implementations_result_item(i, changetype<u32>(strBuf));
    const str = String.UTF8.decode(strBuf);
    result.push(str);
  }

  return result;
}
