use bcrypt::{hash, DEFAULT_COST};

fn main() {
    let passwords = vec![
        ("admin123", "admin password"),
        ("password123", "common password"),
        ("demo123", "demo password"),
        ("test123", "test password"),
    ];

    for (password, description) in passwords {
        match hash(password, DEFAULT_COST) {
            Ok(hashed) => println!("-- {} ({})", description, password),
            Err(e) => println!("Error hashing {}: {}", password, e),
        }
        match hash(password, DEFAULT_COST) {
            Ok(hashed) => println!("UPDATE users SET password_hash = '{}' WHERE email = 'user@example.com';", hashed),
            Err(e) => println!("Error: {}", e),
        }
        println!();
    }
}
