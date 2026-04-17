use ckb_std::error::SysError;

#[repr(i8)]
pub enum Error {
    // System errors (1-11)
    IndexOutOfBound = 1,
    ItemMissing,
    LengthNotEnough,
    Encoding,
    WaitFailure,
    InvalidFd,
    OtherEndClosed,
    MaxVmsSpawned,
    MaxFdsCreated,
    TypeIDError,
    Unknown,

    // Custom errors (-1 and below)
    InvalidArgs = -1,
    InvalidN = -2,
    InvalidTypeId = -3,
    TooManyInputs = -4,

    InvalidTimestamp = -5,
    OutputCountMismatch = -6,
    HeaderNotFound = -7,

    CellDepsCountMismatch = -8,
    RoundRobinFailed = -9,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        match err {
            SysError::IndexOutOfBound => Self::IndexOutOfBound,
            SysError::ItemMissing => Self::ItemMissing,
            SysError::LengthNotEnough(len) => {
                ckb_std::debug!("SysError::LengthNotEnough: {}", len);
                Self::LengthNotEnough
            }
            SysError::Encoding => Self::Encoding,
            SysError::WaitFailure => Self::WaitFailure,
            SysError::InvalidFd => Self::InvalidFd,
            SysError::OtherEndClosed => Self::OtherEndClosed,
            SysError::MaxVmsSpawned => Self::MaxVmsSpawned,
            SysError::MaxFdsCreated => Self::MaxFdsCreated,
            SysError::TypeIDError => Self::TypeIDError,
            SysError::Unknown(code) => {
                ckb_std::debug!("Unknown syscall error occurred: {}", code);
                Self::Unknown
            }
        }
    }
}
