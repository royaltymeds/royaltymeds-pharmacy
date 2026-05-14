-- Resolve Supabase Advisor unindexed foreign key performance warnings.
--
-- The Supabase database linter flags foreign key columns that are not covered by
-- an index on the referencing table. This migration creates one B-tree index for
-- each public-schema foreign key whose constrained columns are not already the
-- leading columns of an existing valid, ready, non-partial index.
--
-- Unused-index warnings are intentionally not addressed here; those indexes may
-- support future workflows and should be reviewed separately when usage patterns
-- are stable.

DO $$
DECLARE
  fk_record record;
  base_index_name text;
  index_name text;
BEGIN
  FOR fk_record IN
    SELECT
      con.oid AS constraint_oid,
      nsp.nspname AS table_schema,
      cls.relname AS table_name,
      con.conname AS constraint_name,
      con.conrelid AS table_oid,
      array_agg(att.attname ORDER BY cols.ordinality) AS column_names
    FROM pg_constraint con
    JOIN pg_class cls
      ON cls.oid = con.conrelid
    JOIN pg_namespace nsp
      ON nsp.oid = cls.relnamespace
    JOIN unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ordinality)
      ON true
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = cols.attnum
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
    GROUP BY con.oid, nsp.nspname, cls.relname, con.conname, con.conrelid, con.conkey
    HAVING NOT EXISTS (
      SELECT 1
      FROM pg_index idx
      WHERE idx.indrelid = con.conrelid
        AND idx.indisvalid
        AND idx.indisready
        AND idx.indpred IS NULL
        AND (
          SELECT array_agg(key_cols.attnum ORDER BY key_cols.ordinality)
          FROM unnest(idx.indkey::smallint[]) WITH ORDINALITY AS key_cols(attnum, ordinality)
          WHERE key_cols.ordinality <= array_length(con.conkey, 1)
        ) = con.conkey
    )
  LOOP
    base_index_name := format(
      'idx_%s_%s_fk',
      fk_record.table_name,
      array_to_string(fk_record.column_names, '_')
    );

    IF length(base_index_name) > 63 THEN
      index_name := left(base_index_name, 54) || '_' || substr(md5(base_index_name), 1, 8);
    ELSE
      index_name := base_index_name;
    END IF;

    IF to_regclass(format('%I.%I', fk_record.table_schema, index_name)) IS NOT NULL THEN
      index_name := left(base_index_name, 50) || '_' || substr(md5(fk_record.constraint_oid::text), 1, 12);
    END IF;

    RAISE NOTICE 'Creating index %.% for foreign key %.%',
      fk_record.table_schema,
      index_name,
      fk_record.table_name,
      fk_record.constraint_name;

    EXECUTE format(
      'CREATE INDEX %I ON %I.%I (%s)',
      index_name,
      fk_record.table_schema,
      fk_record.table_name,
      (
        SELECT string_agg(format('%I', column_name), ', ')
        FROM unnest(fk_record.column_names) AS cols(column_name)
      )
    );
  END LOOP;
END $$;
