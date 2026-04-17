use ckb_hash::new_blake2b;
use ckb_std::ckb_types::packed::{CellInput, Header};
use ckb_std::ckb_types::prelude::*;

use crate::error::Error;

pub fn calc_type_id(input: &CellInput, index: u64) -> [u8; 32] {
    let mut blake2b = new_blake2b();
    blake2b.update(input.as_slice());
    blake2b.update(&index.to_le_bytes());

    let mut type_id = [0u8; 32];
    blake2b.finalize(&mut type_id);

    type_id
}

pub fn decode_timestamp(data: &[u8]) -> Result<u64, Error> {
    if data.len() != 8 {
        return Err(Error::InvalidTimestamp);
    }

    Ok(u64::from_le_bytes(data.try_into().unwrap()))
}

pub fn decode_timestamp_from_header(header: &Header) -> u64 {
    header.raw().timestamp().unpack()
}
