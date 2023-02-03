import bcrypt from "bcrypt";
const usuarios = [
  {
    nombre: "Pablo",
    email: "pablojamiro2008@gmail.com",
    confirmado: 1,
    password: bcrypt.hashSync("12345678", 10),
  },
];

export default usuarios;
