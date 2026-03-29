package com.medicamentos.data.repository

import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.db.MedicationEntity
import com.medicamentos.data.db.PatientEntity
import com.medicamentos.data.model.Medication
import com.medicamentos.data.model.Patient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

class PatientRepository(private val db: AppDatabase) {

    private val patientDao = db.patientDao()
    private val medicationDao = db.medicationDao()

    fun getAllPatients(): Flow<List<Patient>> {
        return patientDao.getAllPatients().map { entities ->
            entities.map { entity ->
                val meds = medicationDao.getMedicationsForPatient(entity.id)
                Patient(
                    id = entity.id,
                    nombre = entity.nombre,
                    numeroCama = entity.numeroCama,
                    colorIndex = entity.colorIndex,
                    medications = meds.map { it.toMedication() }
                )
            }
        }
    }

    fun getMedicationsFlow(patientId: String): Flow<List<Medication>> {
        return medicationDao.getMedicationsForPatientFlow(patientId).map { entities ->
            entities.map { it.toMedication() }
        }
    }

    suspend fun getMedications(patientId: String): List<Medication> {
        return medicationDao.getMedicationsForPatient(patientId).map { it.toMedication() }
    }

    suspend fun addPatient(patient: Patient, medications: List<Medication>) {
        patientDao.insertPatient(patient.toEntity())
        val medicationEntities = medications.map { med ->
            MedicationEntity(
                id = UUID.randomUUID().toString(),
                patientId = patient.id,
                nombre = med.nombre,
                hora = med.hora,
                nregistro = med.nregistro,
                principioActivo = med.principioActivo
            )
        }
        medicationDao.insertMedications(medicationEntities)
    }

    suspend fun addMedicationsToPatient(patientId: String, medications: List<Medication>) {
        val medicationEntities = medications.map { med ->
            MedicationEntity(
                id = UUID.randomUUID().toString(),
                patientId = patientId,
                nombre = med.nombre,
                hora = med.hora,
                nregistro = med.nregistro,
                principioActivo = med.principioActivo
            )
        }
        medicationDao.insertMedications(medicationEntities)
    }

    suspend fun deletePatient(patient: Patient) {
        patientDao.deletePatientById(patient.id)
    }

    suspend fun getAllMedicationsForShift(): List<Pair<Patient, Medication>> {
        val allMedEntities = medicationDao.getAllMedications()
        val result = mutableListOf<Pair<Patient, Medication>>()
        val patientCache = mutableMapOf<String, PatientEntity?>()

        for (medEntity in allMedEntities) {
            val patientEntity = patientCache.getOrPut(medEntity.patientId) {
                patientDao.getPatientById(medEntity.patientId)
            }
            if (patientEntity != null) {
                val patient = Patient(
                    id = patientEntity.id,
                    nombre = patientEntity.nombre,
                    numeroCama = patientEntity.numeroCama,
                    colorIndex = patientEntity.colorIndex
                )
                result.add(Pair(patient, medEntity.toMedication()))
            }
        }
        return result
    }

    // ── Extension helpers ───────────────────────────────────────────────────

    private fun PatientEntity.toPatient(medications: List<Medication> = emptyList()) = Patient(
        id = id,
        nombre = nombre,
        numeroCama = numeroCama,
        colorIndex = colorIndex,
        medications = medications
    )

    private fun Patient.toEntity() = PatientEntity(
        id = id,
        nombre = nombre,
        numeroCama = numeroCama,
        colorIndex = colorIndex
    )

    private fun MedicationEntity.toMedication() = Medication(
        nombre = nombre,
        hora = hora,
        nregistro = nregistro,
        principioActivo = principioActivo
    )
}
