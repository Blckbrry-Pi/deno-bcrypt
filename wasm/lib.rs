#![no_std]
#![no_main]
#![feature(alloc_error_handler, const_mut_refs, allocator_api)]

extern crate alloc;

use bcrypt_no_getrandom as bcrypt;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern "C" {
    fn panic(ptr: *const u8, len: usize);
}

#[panic_handler]
#[no_mangle]
pub fn panic_handler(info: &core::panic::PanicInfo) -> ! {
    let msg = alloc::format!("{info}");
    let ptr = msg.as_ptr();
    let len = msg.capacity();
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

    bcrypt::hash_with_salt(password, cost, salt)
        .expect("Failed to hash password")
        .format_for_version_into(version, output);

    *final_output_len = 60;
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

    matches.write(if hash_matches { 1 } else { 0 });
}
