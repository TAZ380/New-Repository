package com.medicamentos.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "patients")
data class PatientEntity(
    @PrimaryKey val id: String,
    val nombre: String,
    val numeroCama: String,
    val colorIndex: Int
)
