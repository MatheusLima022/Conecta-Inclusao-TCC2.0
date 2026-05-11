import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  try {
    if (typeof password !== "string") {
      return { ok: false, error: "Senha invalida." };
    }

    const trimmed = password.trim();
    if (!trimmed) {
      return { ok: false, error: "Senha nao pode ser vazia." };
    }

    return {
      ok: true,
      hash: await bcrypt.hash(trimmed, SALT_ROUNDS)
    };
  } catch (err) {
    console.error("Erro ao gerar hash de senha:", err);
    return { ok: false, error: "Erro interno ao processar senha." };
  }
}

export async function loginWithLock() {
  return {
    ok: false,
    statusCode: 410,
    message: "Fluxo de login legado removido. Use /auth/login/universal."
  };
}
