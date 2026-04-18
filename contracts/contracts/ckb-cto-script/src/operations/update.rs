use crate::{
    error::Error,
    types::ScriptContext,
    utils::{decode_timestamp, decode_timestamp_from_header},
};
use alloc::vec::Vec;
use ckb_std::{
    ckb_constants::Source,
    high_level::{
        QueryIter, load_cell_data, load_cell_lock_hash, load_cell_type_hash, load_header,
    },
};

pub fn handle_update(context: &ScriptContext, input_data: &[u8]) -> Result<(), Error> {
    // 1. Constrains
    // 1.1 Input count constrain has be enforced
    let old_timestamp = decode_timestamp(input_data)?;

    // 1.2 Enforce Output count constrain
    if load_cell_data(1, Source::GroupOutput).is_ok() {
        return Err(Error::OutputCountMismatch);
    }
    let new_data = load_cell_data(0, Source::GroupOutput)?;
    let new_timestamp = decode_timestamp(&new_data)?;

    // 1.3 Enforce Lock script has be kept same
    if load_cell_lock_hash(0, Source::GroupInput)? != load_cell_lock_hash(0, Source::GroupOutput)? {
        return Err(Error::LockChanged);
    }

    // 1.4 Decode timestamps from the cell deps
    let dep_timestamps: Vec<u64> = QueryIter::new(load_cell_type_hash, Source::CellDep)
        .enumerate()
        // Only cells with the same type script hash
        .filter(|(_, hash)| match hash {
            None => false,
            Some(hash) => hash == context.script_hash,
        })
        // Load timestamp in cells
        .map(|(i, _)| decode_timestamp(&load_cell_data(i, Source::CellDep)?))
        .collect::<Result<Vec<_>, Error>>()?;
    // 1.4 Enforce cell deps count constrain
    if dep_timestamps.len() + 1 != context.n {
        return Err(Error::CellDepsCountMismatch);
    }

    // 2. Round-robin Rotation
    // 2.1 The cell to be updated should be the oldest cell
    for &timestamp in &dep_timestamps {
        if old_timestamp > timestamp {
            return Err(Error::RoundRobinFailed);
        }
    }
    // 2.2 The cell should be updated to a newer timestamp
    if new_timestamp <= old_timestamp {
        return Err(Error::RoundRobinFailed);
    }
    // 2.3 The updated cell should be the newest cell
    for &timestamp in &dep_timestamps {
        if new_timestamp <= timestamp {
            return Err(Error::RoundRobinFailed);
        }
    }

    // 3. Header timestamp proof
    if QueryIter::new(load_header, Source::HeaderDep)
        .find(|h| decode_timestamp_from_header(h) == new_timestamp)
        .is_none()
    {
        return Err(Error::HeaderNotFound);
    }

    Ok(())
}
