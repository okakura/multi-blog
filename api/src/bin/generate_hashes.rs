use bcrypt::{hash, DEFAULT_COST};

#[tokio::main]
async fn main() {
    let passwords_and_emails = vec![
        ("admin123", "john@example.com"),  // keep john as admin
        ("password123", "jane@example.com"),
        ("demo123", "mike@example.com"),
        ("test123", "sarah@example.com"),
        ("user123", "alex@example.com"),
    ];

    println!("-- Generated password hashes for database");
    for (password, email) in passwords_and_emails {
        match hash(password, DEFAULT_COST) {
            Ok(hashed) => {
                println!("-- Password: {}", password);
                println!("UPDATE users SET password_hash = '{}' WHERE email = '{}';", hashed, email);
                println!();
            }
            Err(e) => println!("Error hashing password for {}: {}", email, e),
        }
    }
}
