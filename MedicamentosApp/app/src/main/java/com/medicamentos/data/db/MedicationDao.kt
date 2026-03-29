package com.medicamentos.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MedicationDao {

    @Query("SELECT * FROM medications WHERE patientId = :patientId ORDER BY hora ASC")
    suspend fun getMedicationsForPatient(patientId: String): List<MedicationEntity>

    @Query("SELECT * FROM medications WHERE patientId = :patientId ORDER BY hora ASC")
    fun getMedicationsForPatientFlow(patientId: String): Flow<List<MedicationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedications(medications: List<MedicationEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedication(medication: MedicationEntity)

    @Query("DELETE FROM medications WHERE patientId = :patientId")
    suspend fun deleteForPatient(patientId: String)

    @Query("SELECT * FROM medications ORDER BY hora ASC")
    suspend fun getAllMedications(): List<MedicationEntity>

    @Query("SELECT * FROM medications ORDER BY hora ASC")
    fun getAllMedicationsFlow(): Flow<List<MedicationEntity>>
}
