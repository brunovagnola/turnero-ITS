BEGIN;

CREATE TABLE IF NOT EXISTS public.jornadas (
    fecha date PRIMARY KEY,
    ultimo_numero bigint NOT NULL DEFAULT 0,
    CONSTRAINT jornadas_numero_check
        CHECK (ultimo_numero >= 0)
);

CREATE TABLE IF NOT EXISTS public.turnos (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    jornada date NOT NULL DEFAULT
        ((CURRENT_TIMESTAMP AT TIME ZONE
            'America/Argentina/Buenos_Aires')::date),
    numero varchar(20) NOT NULL,
    estado varchar(20) NOT NULL DEFAULT 'esperando',
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    fecha_atencion timestamptz,

    CONSTRAINT turnos_jornada_numero_key
        UNIQUE (jornada, numero),

    CONSTRAINT turnos_jornada_fkey
        FOREIGN KEY (jornada)
        REFERENCES public.jornadas (fecha),

    CONSTRAINT turnos_estado_check
        CHECK (estado IN ('esperando', 'atendido'))
);

CREATE INDEX IF NOT EXISTS turnos_jornada_estado_id_idx
    ON public.turnos (jornada, estado, id);

COMMIT;