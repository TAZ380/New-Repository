package com.medicamentos.data.model

import java.io.Serializable

data class Patient(
    val id: String,
    val nombre: String,
    val numeroCama: String,
    val colorIndex: Int,
    val medications: List<Medication> = emptyList()
) : Serializable
