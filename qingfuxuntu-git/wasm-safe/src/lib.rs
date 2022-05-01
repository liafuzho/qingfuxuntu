extern crate wasm_bindgen;
extern crate image;
extern crate img_hash;

use std::mem;
use wasm_bindgen::prelude::*;
use img_hash::HasherConfig;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    ptr
}

#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, len: usize) {
    let data = unsafe { Vec::from_raw_parts(ptr, len, len) };
    std::mem::drop(data);
}

#[wasm_bindgen(js_name = imageFeature)]
pub fn image_feature(img_ptr: *mut u8, img_len: usize, ext_ptr: *mut u8, ext_len: usize) -> *mut u8 {
    let ext = unsafe { Vec::from_raw_parts(ext_ptr, ext_len, ext_len) };
    let _ext = match String::from_utf8(ext){
        Ok(ext) => ext,
        Err(error) => {
            panic!("{}", error)
        }
    };
    let img = unsafe { Vec::from_raw_parts(img_ptr, img_len, img_len) };
    let img = match image::load_from_memory_with_format(&img, image::ImageFormat::Png){
        Ok(img) => img.to_luma8(),
        Err(error) => {
            panic!("{}", error);
        }
    };
    let hash = HasherConfig::new().to_hasher().hash_image(&img);
    let hash = hash.as_bytes();
    let mut hash = hash.to_owned();
    let ptr = hash.as_mut_ptr();
    std::mem::forget(hash);
    ptr
}