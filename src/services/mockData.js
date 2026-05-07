export const POSTOS_GRADUACOES = [
  "Cel", "Cel Promo. Req.", "Ten Cel", "Ten Cel Promo. Req.",
  "Maj QOC", "Maj QOA", "Cap QOA", "1ºTen QOC", "1ºTen QOA",
  "2ºTen QOC", "2ºTen QOA", "Aspirante", "Subten", "Subten Promo. Req.",
  "1ºSgt", "2ºSgt", "3ºSgt", "Cb", "Sd"
];

export const TIPOS_AVERBACAO = [
  "INSS", "FFAA", "PMPE", "PM DE OUTROS ESTADOS", "BM DE OUTROS ESTADOS"
];

export const TIPOS_AFASTAMENTO = [
  "FÉRIAS NÃO GOZADAS", "LTIP"
];

const today = new Date();
const addDays = (d, days) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r.toISOString().split("T")[0];
};

const mockMilitares = [
  { matricula: "100001", posto_grad: "Cel", nome: "CARLOS EDUARDO DA SILVA", ordem_hierarquica: 1, sexo: "M", data_ingresso: "1990-03-15", data_ultima_promocao: "2018-06-01", data_nascimento: "1968-07-20", reserva_requerimento: addDays(today, 15), reserva_compulsoria: addDays(today, 400) },
  { matricula: "100002", posto_grad: "Ten Cel", nome: "MARIA FERNANDA OLIVEIRA", ordem_hierarquica: 3, sexo: "F", data_ingresso: "1993-02-10", data_ultima_promocao: "2019-03-15", data_nascimento: "1971-11-05", reserva_requerimento: addDays(today, 45), reserva_compulsoria: addDays(today, 600) },
  { matricula: "100003", posto_grad: "Maj QOC", nome: "JOSÉ ANTÔNIO PEREIRA", ordem_hierarquica: 5, sexo: "M", data_ingresso: "1995-07-20", data_ultima_promocao: "2020-01-10", data_nascimento: "1973-04-12", reserva_requerimento: addDays(today, 80), reserva_compulsoria: addDays(today, 500) },
  { matricula: "100004", posto_grad: "Cap QOA", nome: "ANA BEATRIZ SANTOS", ordem_hierarquica: 7, sexo: "F", data_ingresso: "1998-01-05", data_ultima_promocao: "2021-06-20", data_nascimento: "1976-09-30", reserva_requerimento: addDays(today, 200), reserva_compulsoria: addDays(today, 700) },
  { matricula: "100005", posto_grad: "1ºTen QOC", nome: "PEDRO HENRIQUE COSTA", ordem_hierarquica: 8, sexo: "M", data_ingresso: "2000-03-10", data_ultima_promocao: "2022-01-15", data_nascimento: "1978-02-14", reserva_requerimento: addDays(today, 25), reserva_compulsoria: addDays(today, 450) },
  { matricula: "100006", posto_grad: "Subten", nome: "RICARDO SOUZA LIMA", ordem_hierarquica: 13, sexo: "M", data_ingresso: "1992-08-01", data_ultima_promocao: "2017-11-20", data_nascimento: "1970-06-18", reserva_requerimento: addDays(today, 10), reserva_compulsoria: addDays(today, 350) },
  { matricula: "100007", posto_grad: "1ºSgt", nome: "FRANCISCO DAS CHAGAS NETO", ordem_hierarquica: 15, sexo: "M", data_ingresso: "1996-05-15", data_ultima_promocao: "2019-08-10", data_nascimento: "1974-12-25", reserva_requerimento: addDays(today, 120), reserva_compulsoria: addDays(today, 550) },
  { matricula: "100008", posto_grad: "2ºSgt", nome: "LUÍSA AMANDA FERREIRA", ordem_hierarquica: 16, sexo: "F", data_ingresso: "1999-10-20", data_ultima_promocao: "2020-05-01", data_nascimento: "1977-08-03", reserva_requerimento: addDays(today, 60), reserva_compulsoria: addDays(today, 480) },
  { matricula: "100009", posto_grad: "3ºSgt", nome: "MARCOS VINÍCIUS ALMEIDA", ordem_hierarquica: 17, sexo: "M", data_ingresso: "2001-06-10", data_ultima_promocao: "2021-12-01", data_nascimento: "1979-03-22", reserva_requerimento: addDays(today, 300), reserva_compulsoria: addDays(today, 800) },
  { matricula: "100010", posto_grad: "Cb", nome: "TATIANA CRISTINA ROCHA", ordem_hierarquica: 18, sexo: "F", data_ingresso: "2003-02-28", data_ultima_promocao: "2022-07-15", data_nascimento: "1981-10-10", reserva_requerimento: addDays(today, 500), reserva_compulsoria: addDays(today, 1000) },
  { matricula: "100011", posto_grad: "Sd", nome: "GABRIEL AUGUSTO MENDES", ordem_hierarquica: 19, sexo: "M", data_ingresso: "2005-04-12", data_ultima_promocao: "2023-01-20", data_nascimento: "1983-05-15", reserva_requerimento: addDays(today, 700), reserva_compulsoria: addDays(today, 1200) },
  { matricula: "100012", posto_grad: "Maj QOA", nome: "RENATA PAULA BARROS", ordem_hierarquica: 6, sexo: "F", data_ingresso: "1994-09-01", data_ultima_promocao: "2018-12-10", data_nascimento: "1972-01-28", reserva_requerimento: addDays(today, 20), reserva_compulsoria: addDays(today, 380) },
  { matricula: "100013", posto_grad: "2ºTen QOA", nome: "ANTÔNIO MARCOS FIGUEIREDO", ordem_hierarquica: 11, sexo: "M", data_ingresso: "2002-11-15", data_ultima_promocao: "2023-04-01", data_nascimento: "1980-07-09", reserva_requerimento: addDays(today, 400), reserva_compulsoria: addDays(today, 900) },
  { matricula: "100014", posto_grad: "Cel Promo. Req.", nome: "WILSON BARBOSA CAVALCANTI", ordem_hierarquica: 2, sexo: "M", data_ingresso: "1989-01-10", data_ultima_promocao: "2016-09-15", data_nascimento: "1967-03-05", reserva_requerimento: addDays(today, 5), reserva_compulsoria: addDays(today, 300) },
  { matricula: "100015", posto_grad: "Ten Cel Promo. Req.", nome: "SÉRGIO LUIZ MONTEIRO", ordem_hierarquica: 4, sexo: "M", data_ingresso: "1991-06-20", data_ultima_promocao: "2017-04-01", data_nascimento: "1969-08-14", reserva_requerimento: addDays(today, 55), reserva_compulsoria: addDays(today, 420) },
];

const mockAverbacoes = [
  { id: "av-1", matricula: "100001", tipo: "INSS", dias: 1825, processo_sei_militar: "SEI-001/2023", processo_sei_inss: "INSS-001/2023", obs: "Tempo de serviço civil" },
  { id: "av-2", matricula: "100001", tipo: "FFAA", dias: 365, processo_sei_militar: "SEI-002/2023", processo_sei_inss: "", obs: "Serviço militar obrigatório" },
  { id: "av-3", matricula: "100005", tipo: "PMPE", dias: 730, processo_sei_militar: "SEI-003/2023", processo_sei_inss: "", obs: "" },
  { id: "av-4", matricula: "100006", tipo: "INSS", dias: 2190, processo_sei_militar: "SEI-004/2023", processo_sei_inss: "INSS-002/2023", obs: "Trabalho anterior" },
  { id: "av-5", matricula: "100012", tipo: "PM DE OUTROS ESTADOS", dias: 545, processo_sei_militar: "SEI-005/2024", processo_sei_inss: "", obs: "PMBA" },
];

const mockAfastamentos = [
  { id: "af-1", matricula: "100001", tipo: "FÉRIAS NÃO GOZADAS", dias: 60, processo_sei_militar: "SEI-AF-001/2023", obs: "Ref. 2020 e 2021" },
  { id: "af-2", matricula: "100006", tipo: "LTIP", dias: 90, processo_sei_militar: "SEI-AF-002/2023", obs: "" },
  { id: "af-3", matricula: "100005", tipo: "FÉRIAS NÃO GOZADAS", dias: 30, processo_sei_militar: "SEI-AF-003/2024", obs: "Ref. 2022" },
];

export { mockMilitares, mockAverbacoes, mockAfastamentos };