import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator";
import {
    Precio,
    Categoria,
    Propiedad,
    Mensaje,
    Usuario,
} from "../models/index.js";
import { esVendedor, formatearFecha } from "../helpers/index.js";

const admin = async (req, res) => {
    // Leer QueryStrings
    const { pagina: paginaActual } = req.query;

    const expresion = /^[0-9]$/;

    if (!expresion.test(paginaActual)) {
        return res.redirect("/mis-propiedades?pagina=1");
    }

    try {
        const { id } = req.usuario;

        // Límites y Offset para el paginador
        const limit = 3;
        const offset = paginaActual * limit - limit;
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId: id,
                },
                include: [
                    {
                        model: Categoria,
                        as: "categoria",
                    },
                    {
                        model: Precio,
                        as: "precio",
                    },
                    {
                        model: Mensaje,
                        as: "mensajes",
                    },
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioId: id,
                },
            }),
        ]);

        res.render("propiedades/admin", {
            pagina: "Mis Propiedades",
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit,
        });
    } catch (error) {
        console.log(error);
    }
};

// Formulario para crear una nueva propiedad
const crear = async (req, res) => {
    // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
    ]);

    res.render("propiedades/crear", {
        pagina: "Crear Propiedad",
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {},
    });
};

const guardar = async (req, res) => {
    // Validación
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        // Consultar Modelo de Precio y Categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll(),
        ]);
        res.render("propiedades/crear", {
            pagina: "Crear Propiedad",
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body,
        });
    }

    // Crear un registro

    const {
        titulo,
        descripcion,
        categoria: categoriaId,
        precio: precioId,
        habitaciones,
        estacionamiento,
        wc,
        calle,
        lat,
        lng,
    } = req.body || {};

    const { id: usuarioId } = req.usuario;
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: "",
        });

        const { id } = propiedadGuardada;

        res.redirect(`/propiedades/agregar-imagen/${id}`);
    } catch (error) {
        console.log(error);
    }
};

const agregarImagen = async (req, res) => {
    const { id } = req.params || {};

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad no esté publicada
    if (propiedad.publicado) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad pertenece a quien visita esa página
    if (req?.usuario?.id?.toString() !== propiedad?.usuarioId?.toString()) {
        return res.redirect("/mis-propiedades");
    }

    res.render("propiedades/agregar-imagen", {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        propiedad,
        csrfToken: req.csrfToken(),
    });
};

const almacenarImagen = async (req, res, next) => {
    const { id } = req.params || {};

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad no esté publicada
    if (propiedad.publicado) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad pertenece a quien visita esa página
    if (req?.usuario?.id?.toString() !== propiedad?.usuarioId?.toString()) {
        return res.redirect("/mis-propiedades");
    }

    try {
        // Almacenar imagen y publicar propiedad
        propiedad.imagen = req.file.filename;

        propiedad.publicado = 1;

        await propiedad.save();
        // la redirección se encuentra en dropzone
        next();
    } catch (error) {
        console.log(error);
    }
};

const editar = async (req, res) => {
    const { id } = req.params;

    // validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que quien visita la url es el usuario propietario
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
    ]);

    res.render("propiedades/editar", {
        pagina: "Editar Propiedad",
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad,
    });
};

const guardarCambios = async (req, res) => {
    const { id } = req.params;
    // Validación
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        // Consultar Modelo de Precio y Categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll(),
        ]);
        return res.render("propiedades/editar", {
            pagina: "Editar Propiedad",
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: {
                ...req.body,
                id,
                precioId: req.body.precio,
                categoriaId: req.body.categoria,
            },
        });
    }

    // validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que quien visita la url es el usuario propietario
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    //Reescribir el objeto y actualizarlo
    try {
        const {
            titulo,
            descripcion,
            categoria: categoriaId,
            precio: precioId,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
        } = req.body;

        propiedad.set({
            titulo,
            descripcion,
            categoriaId,
            precioId,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
        });

        await propiedad.save();
        res.redirect("/mis-propiedades");
    } catch (error) {
        console.log(error);
    }
};

const eliminar = async (req, res) => {
    const { id } = req.params;

    // validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que quien visita la url es el usuario propietario
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    try {
        // Eliminar una imagen
        await unlink(`public/uploads/${propiedad.imagen}`);
    } catch (error) {
        console.log(error);
    }

    // Elminar la propiedad
    await propiedad.destroy();

    res.redirect("/mis-propiedades");
};

// Modifica el estado de la propiedad
const cambiarEstado = async (req, res) => {
    const { id } = req.params;

    // validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que quien visita la url es el usuario propietario
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    // Actualizar
    propiedad.publicado = !propiedad.publicado;

    await propiedad.save();

    res.json({
        resultado: true,
    });
};

const mostrarPropiedad = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Categoria,
                as: "categoria",
            },
            {
                model: Precio,
                as: "precio",
            },
            {
                model: Mensaje,
                as: "mensajes",
            },
        ],
    });

    if (!propiedad || !propiedad.publicado) {
        return res.redirect("/404");
    }

    res.render("propiedades/mostrar", {
        pagina: propiedad.titulo,
        propiedad,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
    });
};

const enviarMensaje = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Categoria,
                as: "categoria",
            },
            {
                model: Precio,
                as: "precio",
            },
        ],
    });

    if (!propiedad) {
        return res.redirect("/404");
    }

    // Validación
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render("propiedades/mostrar", {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        });
    }

    const { mensaje } = req.body;
    const { id: propiedadId } = req.params;
    const { id: usuarioId } = req.usuario;

    // Almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId,
    });

    res.render("propiedades/mostrar", {
        pagina: propiedad.titulo,
        propiedad,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado: true,
    });
};

// Leer mensajes
const verMensajes = async (req, res) => {
    const { id } = req.params;

    // validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Mensaje,
                as: "mensajes",
                include: [
                    {
                        model: Usuario.scope("eliminarPassword"),
                        as: "usuario",
                    },
                ],
            },
        ],
    });

    if (!propiedad) {
        return res.redirect("/mis-propiedades");
    }

    // Validar que quien visita la url es el usuario propietario
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    res.render("propiedades/mensajes", {
        pagina: "Mensajes",
        mensajes: propiedad.mensajes,
        formatearFecha,
    });
};

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    cambiarEstado,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes,
};
