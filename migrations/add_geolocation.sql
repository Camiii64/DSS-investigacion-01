-- Migration: add geolocation columns to citas table
-- Run this on both local and Azure MySQL before deploying the geolocation feature

ALTER TABLE citas
  ADD COLUMN latitud  DECIMAL(10,8) NULL AFTER motivo,
  ADD COLUMN longitud DECIMAL(11,8) NULL AFTER latitud;
