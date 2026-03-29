package com.medicamentos.data.model

import java.io.Serializable

data class Medication(
    val nombre: String,
    val hora: String,           // format "HH:MM"
    val nregistro: String? = null,
    val principioActivo: String? = null
) : Serializable
