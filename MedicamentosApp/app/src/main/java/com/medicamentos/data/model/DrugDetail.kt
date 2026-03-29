package com.medicamentos.data.model

data class DrugDetail(
    val nombre: String,
    val nregistro: String,
    val principioActivo: String,
    val grupoTerapeutico: String,
    val codigoAtc: String,
    val formaFarmaceutica: String,
    val viasAdministracion: List<String>,
    val laboratorio: String,
    // From Gemini + ficha técnica
    val mecanismoAccion: String,
    val efectosAdversos: String,
    val diluyentes: String,
    val concentracionMaxima: String
)
