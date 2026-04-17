pub struct ScriptContext<'a> {
    pub script_hash: &'a [u8],
    pub type_id: &'a [u8],
    pub n: usize,
}
