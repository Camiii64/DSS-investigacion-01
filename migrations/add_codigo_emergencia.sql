-- Migración: añade columnas para el código de emergencia
-- Ejecutar en MySQL Workbench (local) y también en la DB de Azure.

USE hospital_DB;

ALTER TABLE usuarios
    ADD COLUMN codigo_emergencia VARCHAR(4) UNIQUE NULL AFTER estado,
    ADD COLUMN codigo_emergencia_usos INT NOT NULL DEFAULT 0 AFTER codigo_emergencia;

-- Si ya corriste la primera versión de la migración (sin la columna de usos),
-- corre solo esto en su lugar:
-- ALTER TABLE usuarios
--     ADD COLUMN codigo_emergencia_usos INT NOT NULL DEFAULT 0 AFTER codigo_emergencia;
