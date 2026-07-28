-- ============================================================
-- DinoPay — Migration 011
-- Fecha: 2026-07-27
-- Descripción: Agrega código ISO del país a units y tabla de festivos
-- ============================================================

-- Código ISO 2 letras del país (ej: "CO", "BR", "PA")
ALTER TABLE units ADD COLUMN IF NOT EXISTS pais_codigo TEXT;

-- ============================================================
-- TABLA: holidays (cache de festivos por país y año)
-- ============================================================
CREATE TABLE IF NOT EXISTS holidays (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  year       INTEGER NOT NULL,
  date       DATE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (country_code, date)
);

-- Índice para consultas por país y año
CREATE INDEX IF NOT EXISTS idx_holidays_country_year
  ON holidays (country_code, year);

-- RLS: solo admins pueden insertar/actualizar, unidades pueden leer
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_holidays" ON holidays
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_holidays" ON holidays
  FOR ALL USING (is_admin());
