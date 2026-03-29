package com.medicamentos.ui.beds

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.model.Patient
import com.medicamentos.data.repository.PatientRepository
import kotlinx.coroutines.launch

class BedsViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    val patientRepository = PatientRepository(db)

    val patients: LiveData<List<Patient>> = patientRepository.getAllPatients().asLiveData()

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun deletePatient(patient: Patient) {
        viewModelScope.launch {
            try {
                patientRepository.deletePatient(patient)
            } catch (e: Exception) {
                _error.value = "Error al eliminar paciente: ${e.message}"
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
}
