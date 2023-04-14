import Propiedad from "./Propiedad.js";
import Precio from "./Precio.js";
import Categoria from "./Categoria.js";
import Usuario from "./Usuario.js";
import Mensaje from "./Mensaje.js";

//Propiedad tiene un Precio (se lee de derecha a izquierda)
Precio.hasOne(Propiedad, { foreignKey: "precioId" });

// Propiedad tiene una Categoría (se lee de derecha a izquierda)
Propiedad.belongsTo(Categoria, { foreignKey: "categoriaId" });

Propiedad.belongsTo(Precio, { foreignKey: "precioId" });

Propiedad.belongsTo(Usuario, { foreignKey: "usuarioId" });

// Relación Inversa
Propiedad.hasMany(Mensaje, { foreignKey: "propiedadId" });


Mensaje.belongsTo(Propiedad, { foreignKey: "propiedadId" });

Mensaje.belongsTo(Usuario, { foreignKey: "usuarioId" });

export { Propiedad, Precio, Categoria, Usuario, Mensaje };
