-- Database: medicion_iot

-- DROP DATABASE IF EXISTS medicion_iot;

-- CREATE DATABASE medicion_iot;

-- TABLE tenants
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE layouts
CREATE TABLE IF NOT EXISTS layouts (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- TABLE sensors
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    type VARCHAR(100),
    unit VARCHAR(20),
    CONSTRAINT fk_tenant_sensor FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Initial data
INSERT INTO tenants (name, domain) VALUES ('Empresa Demo', 'demo.iot.com') ON CONFLICT (domain) DO NOTHING;
