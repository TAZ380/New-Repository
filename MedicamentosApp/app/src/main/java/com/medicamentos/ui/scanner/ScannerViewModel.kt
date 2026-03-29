package com.medicamentos.ui.scanner

import android.graphics.Bitmap
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicamentos.BuildConfig
import com.medicamentos.data.api.GeminiService
import com.medicamentos.data.api.PatientOcrResult
import com.medicamentos.data.model.Medication
import com.medicamentos.data.repository.MedicationRepository
import kotlinx.coroutines.launch

class ScannerViewModel : ViewModel() {

    private val repository = MedicationRepository()
    private val gemini = GeminiService(BuildConfig.GEMINI_API_KEY)

    private val _medications = MutableLiveData<List<Medication>>()
    val medications: LiveData<List<Medication>> = _medications

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _patientOcrResult = MutableLiveData<PatientOcrResult?>()
    val patientOcrResult: LiveData<PatientOcrResult?> = _patientOcrResult

    fun processImage(bitmap: Bitmap) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _patientOcrResult.value = null
            try {
                // Run image processing (OCR → Gemini → CIMA enrichment)
                val enriched = repository.processImage(bitmap)

                if (enriched.isEmpty()) {
                    _error.value = "No se encontraron medicamentos en la imagen"
                    return@launch
                }

                _medications.value = enriched

                // Also try to auto-detect patient info from the same image
                try {
                    val patientData = repository.extractPatientData(bitmap)
                    _patientOcrResult.value = patientData
                } catch (e: Exception) {
                    // Patient detection failure is non-fatal
                    _patientOcrResult.value = PatientOcrResult(medicamentos = enriched)
                }

            } catch (e: Exception) {
                _error.value = "Error al procesar la imagen: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun clearResults() {
        _medications.value = emptyList()
        _patientOcrResult.value = null
        _error.value = null
    }

    fun clearError() {
        _error.value = null
    }
}
