import categorias from "./categorias.js";
import precios from "./precios.js";
import usuarios from "./usuarios.js";
import db from "../config/db.js";
import { Categoria, Precio, Usuario } from "../models/index.js";

const importarDatos = async () => {
  try {
    // Autenticar
    await db.authenticate();
    // Generar las columnas
    await db.sync();

    // Insertamos los datos
    await Promise.all([
      await Categoria.bulkCreate(categorias),
      await Precio.bulkCreate(precios),
      await Usuario.bulkCreate(usuarios),
    ]);

    console.log("Datos Importados Correctamente");
    // exit 0 o vacio significa que finalizó todo bien
    process.exit(0);
  } catch (error) {
    console.log(error);
    // exit 1 significa que hubo un error
    process.exit(1);
  }
};

const eliminarDatos = async () => {
  try {
    // await Promise.all([
    //   Categoria.destroy(
    //     {
    //       where: {},
    //       truncate: true,
    //     },
    //     Precio.destroy({
    //       where: {},
    //       truncate: true,
    //     })
    //   ),
    // ]);
    // esto limpiará todas las tablas (no las borra)
    await db.sync({ force: true });
    console.log("Datos eliminados correctamente");
    process.exit();
  } catch (error) {
    console.log(error);
    // exit 1 significa que hubo un error
    process.exit(1);
  }
};

// desde package json hay comando db:importer
// 0= node, 1 = ./seed/seeder, 2= -i
if (process.argv[2] === "-i") {
  importarDatos();
}

if (process.argv[2] === "-e") {
  eliminarDatos();
}
