package com.medicamentos.data.db

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "medications",
    foreignKeys = [
        ForeignKey(
            entity = PatientEntity::class,
            parentColumns = ["id"],
            childColumns = ["patientId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("patientId")]
)
data class MedicationEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val nombre: String,
    val hora: String,
    val nregistro: String?,
    val principioActivo: String?
)
