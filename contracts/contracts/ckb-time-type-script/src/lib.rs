#![cfg_attr(not(any(feature = "library", test)), no_std)]

#[cfg(not(any(feature = "library", test)))]
extern crate alloc;

pub mod error;
pub mod operations;
pub mod types;
pub mod utils;

mod entry;
pub use entry::entry;
