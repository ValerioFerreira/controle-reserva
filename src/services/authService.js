const MOCK_USER = { cpf: "adm", senha: "adm", nome: "Administrador", perfil: "admin" };

const AUTH_KEY = "cbmpe_auth";

export function login(cpf, senha) {
  if (cpf === MOCK_USER.cpf && senha === MOCK_USER.senha) {
    const session = { cpf: MOCK_USER.cpf, nome: MOCK_USER.nome, perfil: MOCK_USER.perfil };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated() {
  return !!getSession();
}