import express from "express";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/usuarioRoutes.js";
import propiedadRoutes from "./routes/propiedadRoutes.js";
import db from "./config/db.js";

// Crear la app
const app = express();

// Habilitar lectura de datos de formularios
app.use(express.urlencoded({ extended: true }));

// Habilitar Cookie Parser
app.use(cookieParser());

// Habilitar CSRF
app.use(csrf({ cookie: true }));

// Conexión a la base de datos
try {
  // conexion a la bd
  await db.authenticate();
  // crea las tablas
  db.sync();
  console.log("Conexión correcta a la Base de Datos");
} catch (error) {
  console.log(error);
}

// Habilitar Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Carpeta Pública
app.use(express.static("public"));

// Routing
app.use("/auth", userRoutes);
app.use("/", propiedadRoutes);

// Definir un puerto y arrancar el proyecto
const PORT = 3000;

app.listen(PORT, () => {
  console.log("El servidor está en el puerto", PORT);
});
