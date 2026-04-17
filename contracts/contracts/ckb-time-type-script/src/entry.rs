use crate::error::Error;
use crate::operations::{handle_creation, handle_update};
use crate::types::ScriptContext;
use alloc::vec::Vec;
use ckb_std::error::SysError;
use ckb_std::{
    ckb_constants::Source,
    ckb_types::prelude::*,
    high_level::{load_cell_data, load_script},
};

pub fn entry() -> Result<(), Error> {
    let script = load_script()?;
    let args: Vec<u8> = script.args().unpack();
    if args.len() != 33 {
        return Err(Error::InvalidArgs);
    }

    let type_id: &[u8] = &args[0..32];

    let n = args[32] as usize;
    if n == 0 {
        return Err(Error::InvalidN);
    }

    let script_hash = script.calc_script_hash();
    let context = ScriptContext {
        script_hash: script_hash.as_slice(),
        type_id,
        n,
    };

    // Enforce Input count constrain
    if load_cell_data(1, Source::GroupOutput).is_ok() {
        return Err(Error::TooManyInputs);
    }

    // Check if we are in creation or update
    match load_cell_data(0, Source::GroupOutput) {
        Err(SysError::IndexOutOfBound) => handle_creation(&context),
        Ok(data) => handle_update(&context, &data),
        Err(err) => Err(err.into()),
    }
}
