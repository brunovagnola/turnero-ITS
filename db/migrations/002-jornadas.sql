BEGIN;

-- Asociar los registros existentes a su fecha local de creación.
ALTER TABLE public.turnos
    ADD COLUMN jornada date;

UPDATE public.turnos
SET jornada =
    (fecha_creacion AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;

ALTER TABLE public.turnos
    ALTER COLUMN jornada SET NOT NULL,
    ALTER COLUMN jornada SET DEFAULT
        ((CURRENT_TIMESTAMP AT TIME ZONE
            'America/Argentina/Buenos_Aires')::date);

-- Un mismo número puede repetirse en jornadas diferentes.
ALTER TABLE public.turnos
    DROP CONSTRAINT turnos_numero_key,
    ADD CONSTRAINT turnos_jornada_numero_key
        UNIQUE (jornada, numero);

-- Contador independiente por jornada.
CREATE TABLE public.jornadas (
    fecha date PRIMARY KEY,
    ultimo_numero bigint NOT NULL DEFAULT 0,
    CONSTRAINT jornadas_numero_check CHECK (ultimo_numero >= 0)
);

-- Continuar la numeración de las jornadas que ya tienen datos.
INSERT INTO public.jornadas (fecha, ultimo_numero)
SELECT jornada, MAX(SUBSTRING(numero FROM 3)::bigint)
FROM public.turnos
WHERE numero ~ '^A-[0-9]+$'
GROUP BY jornada;

-- Cada turno debe pertenecer a una jornada existente.
ALTER TABLE public.turnos
    ADD CONSTRAINT turnos_jornada_fkey
        FOREIGN KEY (jornada)
        REFERENCES public.jornadas (fecha);

CREATE INDEX turnos_jornada_estado_id_idx
    ON public.turnos (jornada, estado, id);

COMMIT;