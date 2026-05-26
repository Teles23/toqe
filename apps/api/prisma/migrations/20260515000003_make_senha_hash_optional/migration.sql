-- Torna senhaHash nullable para suportar usuários OAuth (Google) que não têm senha local.
-- AuthService.login deve checar `!user.senhaHash` antes de bcrypt.compare e retornar
-- 401 com mensagem clara ("Usuário OAuth — use login Google").
ALTER TABLE "TQE_USUARIO"
  ALTER COLUMN "TQE_USR_SENHA_HASH" DROP NOT NULL;
