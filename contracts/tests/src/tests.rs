use ckb_testtool::builtin::ALWAYS_SUCCESS;
use ckb_testtool::ckb_hash::new_blake2b;
use ckb_testtool::ckb_types::{bytes::Bytes, core::TransactionBuilder, packed::*, prelude::*};
use ckb_testtool::context::Context;

const MAX_CYCLES: u64 = 10_000_000;

fn calc_type_id(input: &CellInput, index: u64) -> [u8; 32] {
    let mut blake2b = new_blake2b();
    blake2b.update(input.as_slice());
    blake2b.update(&index.to_le_bytes());
    let mut type_id = [0u8; 32];
    blake2b.finalize(&mut type_id);
    type_id
}

fn build_args(mut type_id: Vec<u8>, n: u8) -> Bytes {
    type_id.push(n);
    Bytes::from(type_id)
}

fn bytes_from_u64(num: u64) -> Bytes {
    Bytes::from(num.to_le_bytes().to_vec())
}

fn prepare_context() -> (Context, Script, Script) {
    let mut context = Context::default();
    let ckb_time_bin = context.deploy_cell_by_name("ckb-time-type-script");
    let always_success_bin = context.deploy_cell(ALWAYS_SUCCESS.clone());

    let always_success = context
        .build_script(&always_success_bin, Bytes::new())
        .expect("script");
    let ckb_time = context
        .build_script(&ckb_time_bin, Bytes::new())
        .expect("script");

    (context, always_success, ckb_time)
}

fn add_header_with_timestamp(context: &mut Context, timestamp: u64) -> Byte32 {
    let header = Header::new_builder()
        .raw(RawHeader::new_builder().timestamp(timestamp).build())
        .build()
        .into_view();
    let hash = header.hash();

    context.insert_header(header);

    hash
}

#[test]
fn test_creation_success() {
    let (mut context, always_success, ckb_time) = prepare_context();

    let input = CellInput::new_builder()
        .previous_output(context.create_cell(
            CellOutput::new_builder().lock(always_success).build(),
            Bytes::new(),
        ))
        .build();

    let ckb_time = ckb_time
        .as_builder()
        .args(build_args(calc_type_id(&input, 0).into(), 3))
        .build();

    let ckb_time_output = CellOutput::new_builder()
        .type_(Some(ckb_time.clone()).pack())
        .build();

    let outputs_data = [100, 200, 300].map(bytes_from_u64);

    let tx = TransactionBuilder::default()
        .input(input)
        .outputs(vec![
            ckb_time_output.clone(),
            ckb_time_output.clone(),
            ckb_time_output.clone(),
        ])
        .outputs_data(outputs_data.pack())
        .header_deps(vec![
            add_header_with_timestamp(&mut context, 100),
            add_header_with_timestamp(&mut context, 200),
            add_header_with_timestamp(&mut context, 300),
        ])
        .build();

    let tx = context.complete_tx(tx);

    let cycles = context
        .verify_tx(&tx, MAX_CYCLES)
        .expect("pass verification");
    println!("consume cycles: {}", cycles);
}

#[test]
fn test_update_success() {
    let (mut context, always_success, ckb_time) = prepare_context();

    let ckb_time = ckb_time
        .as_builder()
        .args(build_args([0u8; 32].into(), 3))
        .build();

    let ckb_time_output = CellOutput::new_builder()
        .lock(always_success)
        .type_(Some(ckb_time.clone()).pack())
        .build();
    let dep_cell1 = context.create_cell(ckb_time_output.clone(), bytes_from_u64(200));
    let dep_cell2 = context.create_cell(ckb_time_output.clone(), bytes_from_u64(300));

    let cell_dep1 = CellDep::new_builder().out_point(dep_cell1).build();
    let cell_dep2 = CellDep::new_builder().out_point(dep_cell2).build();

    let input_out_point = context.create_cell(ckb_time_output.clone(), bytes_from_u64(100));
    let input = CellInput::new_builder()
        .previous_output(input_out_point)
        .build();

    let tx = TransactionBuilder::default()
        .input(input)
        .cell_deps(vec![cell_dep1, cell_dep2])
        .output(ckb_time_output)
        .output_data(bytes_from_u64(400))
        .header_dep(add_header_with_timestamp(&mut context, 400))
        .build();

    let tx = context.complete_tx(tx);

    let cycles = context
        .verify_tx(&tx, MAX_CYCLES)
        .expect("pass verification");
    println!("consume cycles: {}", cycles);
}
