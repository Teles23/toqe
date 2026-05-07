-- Criar role da aplicação (sem ser superuser)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'toqe_app') THEN
    CREATE ROLE toqe_app LOGIN PASSWORD 'senha_forte';
  END IF;
END
$$;

-- Criar role admin que bypassa RLS (para operações internas do Toqe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'toqe_admin') THEN
    CREATE ROLE toqe_admin BYPASSRLS LOGIN PASSWORD 'senha_admin';
  END IF;
END
$$;

-- Conceder permissões ao toqe_app
GRANT USAGE ON SCHEMA public TO toqe_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO toqe_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO toqe_app;

-- Conceder permissões ao toqe_admin
GRANT USAGE ON SCHEMA public TO toqe_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO toqe_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO toqe_admin;

-- Garantir que permissões futuras sejam herdadas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO toqe_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO toqe_app;