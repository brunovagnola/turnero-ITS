BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.turnos_numero_seq
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO CYCLE;

CREATE TABLE IF NOT EXISTS public.turnos (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero varchar(20) NOT NULL UNIQUE,
    estado varchar(20) NOT NULL DEFAULT 'esperando',
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    fecha_atencion timestamptz,
    CONSTRAINT turnos_estado_check
        CHECK (estado IN ('esperando', 'atendido'))
);

COMMIT;