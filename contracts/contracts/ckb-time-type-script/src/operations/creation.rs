use crate::{
    error::Error,
    types::ScriptContext,
    utils::{calc_type_id, decode_timestamp, decode_timestamp_from_header},
};
use alloc::vec::Vec;
use ckb_std::{
    ckb_constants::Source,
    high_level::{QueryIter, load_cell_data, load_cell_type_hash, load_header, load_input},
};

pub fn handle_creation(context: &ScriptContext) -> Result<(), Error> {
    // 1. Uniqueness (Type ID)
    let first_input = load_input(0, Source::Input)?;
    let first_output_index = QueryIter::new(load_cell_type_hash, Source::Output)
        .position(|hash| match hash {
            None => false,
            Some(hash) => hash == context.script_hash,
        })
        .unwrap() as u64;

    let expected_id = calc_type_id(&first_input, first_output_index);
    if context.type_id != expected_id {
        return Err(Error::InvalidTypeId);
    }

    // 2. Initialization
    // 2.1 Enforce outputs count constrain
    let outputs_data: Vec<Vec<u8>> = QueryIter::new(load_cell_data, Source::GroupOutput).collect();
    if outputs_data.len() != context.n {
        return Err(Error::OutputCountMismatch);
    }

    // 2.2 Each output timestamp should has correspond header timestamp proof
    let header_timestamps: Vec<u64> = QueryIter::new(load_header, Source::HeaderDep)
        .map(|h| decode_timestamp_from_header(&h))
        .collect();

    for data in outputs_data {
        let timestamp = decode_timestamp(&data)?;

        if !header_timestamps.contains(&timestamp) {
            ckb_std::debug!("Header for timestamp {} not found", timestamp);
            return Err(Error::HeaderNotFound);
        }
    }

    Ok(())
}
