#![no_std]
#![feature(alloc_error_handler, const_mut_refs, allocator_api)]

extern crate alloc;


use talc::*;
use bcrypt_no_getrandom as bcrypt;

// BCrypt only needs at most 4kb of RAM. Using 8kb to be safe.
static mut START_ARENA: [u8; 8192] = [0; 8192];

// The mutex provided by the `spin` crate is used here as it's a sensible choice

// Allocations may occur prior to the execution of `main()`, thus support for
// claiming memory on-demand is required, such as the ClaimOnOom OOM handler.

#[global_allocator]
static TALC: Talck<spin::Mutex<()>, ClaimOnOom> = Talc::new(unsafe {
    ClaimOnOom::new(Span::from_const_array(&START_ARENA as *const _))
}).lock();

extern "C" {
    fn panic(ptr: *const u8, len: usize);
}

#[panic_handler]
#[no_mangle]
pub fn panic_handler(info: &core::panic::PanicInfo) -> ! {
    let msg = alloc::format!("{info}");
    let ptr = msg.as_ptr();
    let len = msg.len();
    unsafe { panic(ptr, len) };

    loop {}
}

#[alloc_error_handler]
#[no_mangle]
pub fn alloc_error_handler(layout: core::alloc::Layout) -> ! {
    panic!("Memory allocation of {} bytes failed", layout.size());
}

#[no_mangle]
pub unsafe fn alloc(size: usize) -> *mut u8 {
    let align = core::mem::align_of::<usize>();
    let layout = alloc::alloc::Layout::from_size_align_unchecked(size, align);
    alloc::alloc::alloc(layout)
}

#[no_mangle]
pub unsafe fn dealloc(ptr: *mut u8, size: usize) {
    let align = core::mem::align_of::<usize>();
    let layout = alloc::alloc::Layout::from_size_align_unchecked(size, align);
    alloc::alloc::dealloc(ptr, layout);
}



#[no_mangle]
pub unsafe fn hash(
    password_ptr: *const u8,
    password_len: usize,

    salt_ptr: *const u8,
    salt_len: usize,

    output_ptr: *mut u8,
    output_len: usize,
    final_output_len: *mut usize,

    version: u32,
    cost: u32,
) {
    let password = core::slice::from_raw_parts(password_ptr, password_len);
    let salt = core::slice::from_raw_parts(salt_ptr, salt_len);
    let output = core::slice::from_raw_parts_mut(output_ptr, output_len);

    let salt: [u8; 16] = salt.try_into().expect("Salt is not 16 bytes long");

    let version = match version as u8 {
        b'a' => bcrypt::Version::TwoA,
        b'x' => bcrypt::Version::TwoX,
        b'y' => bcrypt::Version::TwoY,
        b'b' => bcrypt::Version::TwoB,
        _ => panic!("Invalid version: {version}"),
    };

    let hash = bcrypt::hash_with_salt(password, cost, salt).expect("Failed to hash password");
    let digest = hash.format_for_version(version);

    if digest.len() > output_len {
        panic!("Output buffer too small!");
    }

    output[..digest.len()].copy_from_slice(digest.as_bytes());
    final_output_len.write(digest.len());
}

#[no_mangle]
pub unsafe fn verify(
    password_ptr: *const u8,
    password_len: usize,

    hash_ptr: *const u8,
    hash_len: usize,

    matches: *mut u8,
) {
    let password = core::slice::from_raw_parts(password_ptr, password_len);
    let hash = core::slice::from_raw_parts(hash_ptr, hash_len);
    let hash = core::str::from_utf8(hash).expect("Hash is invalid UTF-8");

    let hash_matches = bcrypt::verify(password, hash).expect("Failed to verify hash");

    matches.write(if hash_matches { 1 } else  { 0 });
}
