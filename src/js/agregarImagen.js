import { Dropzone } from "dropzone";

const token = document
    ?.querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

Dropzone.options.imagen = {
    dictDefaultMessage: "Sube tus imágenes aquí",
    acepptedFiles: ".png,.jpg,.jpeg",
    maxFilesize: 5, // en megas
    maxFiles: 1,
    parallelUploads: 1,
    autoProcessQueue: false,
    addRemoveLinks: true,
    dictRemoveFile: "Borrar archivo",
    dictMaxFilesExceeded: "El límite es 1 Archivo",
    headers: {
        "CSRF-Token": token,
    },
    paramName: "imagen",
    // para cuando tengamos el autoprocessqueue en false
    // iniciamos el evento
    init: function () {
        const dropzone = this;
        const btnPublicar = document.querySelector("#publicar");

        btnPublicar.addEventListener("click", function () {
            dropzone.processQueue();
        });

        dropzone.on("queuecomplete", function () {
            if (dropzone.getActiveFiles().length == 0) {
                window.location.href = "/mis-propiedades";
            }
        });
    },
};
