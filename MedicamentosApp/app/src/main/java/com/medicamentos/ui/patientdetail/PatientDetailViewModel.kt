package com.medicamentos.ui.patientdetail

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.model.Medication
import com.medicamentos.data.repository.PatientRepository
import kotlinx.coroutines.launch

class PatientDetailViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val patientRepository = PatientRepository(db)

    private val _medications = MutableLiveData<List<Medication>>()
    val medications: LiveData<List<Medication>> = _medications

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var currentPatientId: String? = null

    fun loadMedications(patientId: String) {
        currentPatientId = patientId
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val meds = patientRepository.getMedications(patientId)
                _medications.value = meds.sortedBy { it.hora }
            } catch (e: Exception) {
                _error.value = "Error cargando medicamentos: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun observeMedications(patientId: String): LiveData<List<Medication>> {
        currentPatientId = patientId
        return patientRepository.getMedicationsFlow(patientId).asLiveData()
    }

    fun addMedications(medications: List<Medication>) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                patientRepository.addMedicationsToPatient(patientId, medications)
                loadMedications(patientId)
            } catch (e: Exception) {
                _error.value = "Error añadiendo medicamentos: ${e.message}"
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
}
