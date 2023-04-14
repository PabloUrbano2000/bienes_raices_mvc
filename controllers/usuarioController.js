import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import { generarId, generarJWT } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";

const formularioLogin = (req, res) => {
    res.render("auth/login", {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(),
    });
};

const autenticar = async (req, res) => {
    await check("email")
        .isEmail()
        .withMessage("El Email es Obligatorio")
        .run(req);
    await check("password")
        .notEmpty()
        .withMessage("El Password es Obligatorio")
        .run(req);

    let resultado = validationResult(req);

    const { email, password } = req.body;

    // verificar que el resultado esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render("auth/login", {
            pagina: "Iniciar Sesión",
            errores: resultado.array(),
            usuario: {
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({
        where: { email },
    });
    if (!usuario) {
        return res.render("auth/login", {
            pagina: "Iniciar Sesión",
            errores: [{ msg: "El Usuario No Existe" }],
            usuario: {
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Comprobar si el usuario está confirmado
    if (!usuario.confirmado) {
        return res.render("auth/login", {
            pagina: "Iniciar Sesión",
            errores: [{ msg: "Tu Cuenta no ha sido Confirmada" }],
            usuario: {
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Revisar el password
    if (!usuario.verificarPassword(password)) {
        return res.render("auth/login", {
            pagina: "Iniciar Sesión",
            errores: [{ msg: "El Password es incorrecto" }],
            usuario: {
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Autenticar al usuario
    const token = generarJWT(usuario.id);
    console.log(token, usuario.id);

    // Almacenar en un cookie
    return res
        .cookie("_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true,
        })
        .redirect("/mis-propiedades");
};

const cerrarSesion = async (req, res) => {
    return res.clearCookie("_token").status(200).redirect("/auth/login");
};

const formularioRegistro = (req, res) => {
    console.log(req.csrfToken());
    res.render("auth/registro", {
        pagina: "Crear Cuenta",
        csrfToken: req.csrfToken(),
    });
};
const registrar = async (req, res) => {
    // Validación
    await check("nombre")
        .notEmpty()
        .withMessage("El Nombre no puede ir vacío")
        .run(req);
    await check("email")
        .isEmail()
        .withMessage("Eso no parece un email")
        .run(req);
    await check("password")
        .isLength({ min: 6 })
        .withMessage("El Password debe ser al menos de 6 caracteres")
        .run(req);
    await check("repetir_password")
        .equals(req.body.password)
        .withMessage("Los Passwords no son iguales")
        .run(req);

    let resultado = validationResult(req);

    const { nombre, email, password } = req.body;

    // verificar que el resultado esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render("auth/registro", {
            pagina: "Crear Cuenta",
            errores: resultado.array(),
            usuario: {
                nombre,
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Verificar que el usuario no esté registrado
    const existeUsuario = await Usuario.findOne({
        where: { email },
    });

    if (existeUsuario) {
        return res.render("auth/registro", {
            pagina: "Crear Cuenta",
            errores: [{ msg: "El Usuario ya está Registrado" }],
            usuario: {
                nombre,
                email,
            },
            csrfToken: req.csrfToken(),
        });
    }

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId(),
    });

    // Envía email de confirmación
    await emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token,
    });

    // Mostrar mensaje de confirmación
    res.render("templates/mensaje", {
        pagina: "Cuenta Creada correctamente",
        mensaje:
            "Hemos Enviado un Email de confirmación, presiona en el enlace",
    });
};

// Funcion que comprueba una cuenta
const confirmar = async (req, res, next) => {
    const { token } = req.params;

    // Verificar si el token es válido
    const usuario = await Usuario.findOne({
        where: { token },
    });

    if (!usuario) {
        return res.render("auth/confirmar-cuenta", {
            pagina: "Error al confirmar tu cuenta",
            mensaje: "Hubo un error al confirmar tu cuenta",
            error: true,
        });
    }
    // Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;

    await usuario.save();

    res.render("auth/confirmar-cuenta", {
        pagina: "Cuenta Confirmada",
        mensaje: "La cuenta se confirmó correctamente",
    });

    next();
};

const formularioOlvidePassword = (req, res) => {
    res.render("auth/olvide-password", {
        pagina: "Recupera tu acceso a Bienes Raices",
        csrfToken: req.csrfToken(),
    });
};

const resetPassword = async (req, res) => {
    await check("email")
        .isEmail()
        .withMessage("Eso no parece un email")
        .run(req);
    let resultado = validationResult(req);
    // verificar que el resultado esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render("auth/olvide-password", {
            pagina: "Recupera tu acceso a Bienes Raices",
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        });
    }

    // Buscar el usuario
    const { email } = req.body;
    const usuario = await Usuario.findOne({
        where: { email },
    });
    if (!usuario) {
        return res.render("auth/olvide-password", {
            pagina: "Recupera tu acceso a Bienes Raices",
            csrfToken: req.csrfToken(),
            errores: [{ msg: "El email no pertenece a ningún usuario" }],
        });
    }

    usuario.token = generarId();
    await usuario.save();

    // Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token,
    });

    // Mostrar mensaje de cambio de contraseña
    res.render("templates/mensaje", {
        pagina: "Reestablece tu Password",
        mensaje: "Hemos Enviado un Email con las instrucciones",
    });
};

const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({
        where: {
            token,
        },
    });
    if (!usuario) {
        return res.render("auth/confirmar-cuenta", {
            pagina: "Reestablece tu Password",
            mensaje: "Hubo un error al validar tu información, intenta denuevo",
            error: true,
        });
    }

    // Mostrar formulario de reseteo de pass
    res.render("auth/reset-password", {
        pagina: "Reestablece Tu Password",
        csrfToken: req.csrfToken(),
    });
};

const nuevoPassword = async (req, res) => {
    // Validar el password
    await check("password")
        .isLength({ min: 6 })
        .withMessage("El Password debe ser al menos de 6 caracteres")
        .run(req);

    let resultado = validationResult(req);
    // verificar que el resultado esté vacío
    if (!resultado.isEmpty()) {
        // Errores
        return res.render("auth/reset-password", {
            pagina: "Reestablece tu Password",
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token } });

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;
    await usuario.save();
    res.render("auth/confirmar-cuenta", {
        pagina: "Password Reestablecido",
        mensaje: "El Password se guardó correctamente",
    });
};

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword,
};
