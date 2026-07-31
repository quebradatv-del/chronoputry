use std::{env, fs, io, path::Path};

const ICON_SIZE: u32 = 32;

fn push_u16(buffer: &mut Vec<u8>, value: u16) {
    buffer.extend_from_slice(&value.to_le_bytes());
}

fn push_u32(buffer: &mut Vec<u8>, value: u32) {
    buffer.extend_from_slice(&value.to_le_bytes());
}

fn create_windows_icon(path: &Path) -> io::Result<()> {
    let width = ICON_SIZE;
    let height = ICON_SIZE;
    let xor_size = width * height * 4;
    let mask_row_size = width.div_ceil(32) * 4;
    let mask_size = mask_row_size * height;
    let image_size = 40 + xor_size + mask_size;

    let mut icon = Vec::with_capacity((22 + image_size) as usize);

    // ICO header.
    push_u16(&mut icon, 0);
    push_u16(&mut icon, 1);
    push_u16(&mut icon, 1);

    // Directory entry.
    icon.push(width as u8);
    icon.push(height as u8);
    icon.push(0);
    icon.push(0);
    push_u16(&mut icon, 1);
    push_u16(&mut icon, 32);
    push_u32(&mut icon, image_size);
    push_u32(&mut icon, 22);

    // BITMAPINFOHEADER. ICO stores XOR and AND bitmaps, hence doubled height.
    push_u32(&mut icon, 40);
    push_u32(&mut icon, width);
    push_u32(&mut icon, height * 2);
    push_u16(&mut icon, 1);
    push_u16(&mut icon, 32);
    push_u32(&mut icon, 0);
    push_u32(&mut icon, xor_size);
    push_u32(&mut icon, 0);
    push_u32(&mut icon, 0);
    push_u32(&mut icon, 0);
    push_u32(&mut icon, 0);

    let center = (ICON_SIZE as i32 - 1) / 2;
    let radius = 12_i32;

    // BGRA pixels, stored bottom-up.
    for y in (0..ICON_SIZE as i32).rev() {
        for x in 0..ICON_SIZE as i32 {
            let dx = x - center;
            let dy = y - center;
            let distance_squared = dx * dx + dy * dy;
            let on_ring = distance_squared >= (radius - 2).pow(2)
                && distance_squared <= radius.pow(2);
            let on_vertical_hand = (x - center).abs() <= 1 && y >= 7 && y <= center;
            let on_diagonal_hand = y - center == (x - center) / 2
                && x >= center
                && x <= center + 8;

            let (red, green, blue, alpha) = if on_diagonal_hand {
                (255, 120, 80, 255)
            } else if on_ring || on_vertical_hand {
                (240, 240, 240, 255)
            } else {
                (25, 25, 28, 255)
            };

            icon.extend_from_slice(&[blue, green, red, alpha]);
        }
    }

    // Fully opaque AND mask.
    icon.resize(icon.len() + mask_size as usize, 0);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, icon)
}

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is set by Cargo");
    let icon_path = Path::new(&manifest_dir).join("icons/icon.ico");

    create_windows_icon(&icon_path).expect("failed to generate Windows icon");
    tauri_build::build()
}
