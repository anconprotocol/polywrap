use crate::{abort, invoke};

use wasm_bindgen::prelude::*;

pub use super::{mutation_method_wrapped, object_method_wrapped};
pub use super::{InputMutationMethod, InputObjectMethod};

#[wasm_bindgen]
pub fn _w3_init() {
    invoke::w3_add_invoke("mutation_method", mutation_method_wrapped);
    invoke::w3_add_invoke("object_method", object_method_wrapped);
}

#[wasm_bindgen]
pub fn _w3_invoke(method_size: u32, args_size: u32) -> bool {
    invoke::w3_invoke(method_size, args_size)
}

#[wasm_bindgen]
pub fn w3_abort(msg: &str, file: &str, line: u32, column: u32) {
    abort::w3_abort(msg, file, line, column);
}