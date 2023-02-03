import Sequelize from "sequelize";
import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});

const db = new Sequelize(
  process.env.BD_NOMBRE,
  process.env.BD_USER,
  process.env.BD_PASS ?? "",
  {
    host: process.env.BD_HOST,
    port: 3306,
    dialect: "mysql",
    define: {
      // agrega los campos fecha de creación y actualización
      timestamps: true,
    },
    pool: {
      // maximo 5 conexiones
      max: 5,
      // minimo 0 conexiones
      min: 0,
      // tiempo antes de marcar error
      acquire: 30000,
      // tiempo para liberar espacio o memoria
      idle: 10000,
    },
    operatorAliases: false,
  }
);

export default db;
