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
  autoProcessQueue: true,
  addRemoveLinks: true,
  dictRemoveFile: "Borrar archivo",
  dictMaxFilesExceeded: "El límite es 1 Archivo",
  headers: {
    "CSRF-Token": token,
  },
};
