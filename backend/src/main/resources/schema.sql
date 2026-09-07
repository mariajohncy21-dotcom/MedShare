-- MedShare PostgreSQL Database Schema (Section 27 Requirement)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    phone VARCHAR(32),
    source_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_sources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- PHARMACY, HOSPITAL
    address TEXT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    operating_hours VARCHAR(64) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rating DOUBLE PRECISION DEFAULT 4.5,
    emergency_support_24x7 BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    dosage VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    description TEXT,
    critical_threshold INT NOT NULL,
    low_threshold INT NOT NULL,
    average_daily_demand INT NOT NULL
);

CREATE TABLE IF NOT EXISTS medicine_inventory (
    id VARCHAR(64) PRIMARY KEY,
    medicine_id VARCHAR(64) NOT NULL REFERENCES medicines(id),
    source_id VARCHAR(64) NOT NULL REFERENCES medical_sources(id),
    source_type VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(64) PRIMARY KEY, -- e.g. MED-4587
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    medicine_id VARCHAR(64) NOT NULL REFERENCES medicines(id),
    total_quantity INT NOT NULL,
    urgency VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL, -- PENDING, CONFIRMED, COLLECTED, EXPIRED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    qr_token VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation_allocations (
    id SERIAL PRIMARY KEY,
    reservation_id VARCHAR(64) NOT NULL REFERENCES reservations(id),
    source_id VARCHAR(64) NOT NULL REFERENCES medical_sources(id),
    quantity INT NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_requests (
    id VARCHAR(64) PRIMARY KEY, -- e.g. EMR-8892
    user_id VARCHAR(64) REFERENCES users(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(32) NOT NULL,
    medicine_id VARCHAR(64) NOT NULL REFERENCES medicines(id),
    quantity INT NOT NULL,
    urgency VARCHAR(32) NOT NULL,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    additional_notes TEXT,
    status VARCHAR(32) NOT NULL, -- BROADCASTING, MATCHED, FULFILLED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(64) PRIMARY KEY, -- e.g. TRF-1029
    medicine_id VARCHAR(64) NOT NULL REFERENCES medicines(id),
    from_source_id VARCHAR(64) NOT NULL REFERENCES medical_sources(id),
    to_source_id VARCHAR(64) NOT NULL REFERENCES medical_sources(id),
    quantity INT NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    expiry_date DATE NOT NULL,
    reason VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL, -- PENDING, APPROVED, IN_TRANSIT, COMPLETED, REJECTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
