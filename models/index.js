import Propiedad from "./Propiedad.js";
import Precio from "./Precio.js";
import Categoria from "./Categoria.js";
import Usuario from "./Usuario.js";

//Propiedad tiene un Precio (se lee de derecha a izquierda)
Precio.hasOne(Propiedad, { foreignKey: "precioId" });

// Propiedad tiene una Categoría (se lee de derecha a izquierda)
Propiedad.belongsTo(Categoria, { foreignKey: "categoriaId" });

Propiedad.belongsTo(Usuario, { foreignKey: "usuarioId" });

export { Propiedad, Precio, Categoria, Usuario };
