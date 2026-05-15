-- Migración: añade columnas para recuperación de contraseña
-- Ejecutar en MySQL Workbench (local) y también en la DB de Azure.

USE hospital_DB;

ALTER TABLE usuarios
    ADD COLUMN reset_codigo VARCHAR(6) NULL AFTER codigo_emergencia_usos,
    ADD COLUMN reset_expira DATETIME NULL AFTER reset_codigo;
