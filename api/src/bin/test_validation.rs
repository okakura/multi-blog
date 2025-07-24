// Test validation system manually

fn main() {
    println!("Testing validation system...");

    // Test password validation
    let weak_password = "weak";
    let strong_password = "StrongPass123!";

    println!("Testing password validation:");
    println!(
        "Weak password '{}': {:?}",
        weak_password,
        api::validation::rules::validate_password_strength(weak_password)
    );
    println!(
        "Strong password '{}': {:?}",
        strong_password,
        api::validation::rules::validate_password_strength(strong_password)
    );

    // Test slug validation
    let good_slug = "valid-slug-123";
    let bad_slug = "--invalid-slug--";

    println!("\nTesting slug validation:");
    println!(
        "Good slug '{}': {:?}",
        good_slug,
        api::validation::rules::validate_slug(good_slug)
    );
    println!(
        "Bad slug '{}': {:?}",
        bad_slug,
        api::validation::rules::validate_slug(bad_slug)
    );

    // Test hostname validation
    let good_hostname = "example.com";
    let bad_hostname = "invalid..hostname";

    println!("\nTesting hostname validation:");
    println!(
        "Good hostname '{}': {:?}",
        good_hostname,
        api::validation::rules::validate_hostname(good_hostname)
    );
    println!(
        "Bad hostname '{}': {:?}",
        bad_hostname,
        api::validation::rules::validate_hostname(bad_hostname)
    );

    println!("\nValidation system test completed!");
}
