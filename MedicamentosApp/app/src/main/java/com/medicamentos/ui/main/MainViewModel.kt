package com.medicamentos.ui.main

import android.graphics.Bitmap
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicamentos.data.model.Medication
import com.medicamentos.data.repository.MedicationRepository
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {

    private val repository = MedicationRepository()

    private val _medications = MutableLiveData<List<Medication>>()
    val medications: LiveData<List<Medication>> = _medications

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun processImage(bitmap: Bitmap) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val result = repository.processImage(bitmap)
                _medications.value = result
                if (result.isEmpty()) {
                    _error.value = "No se encontraron medicamentos en la imagen"
                }
            } catch (e: Exception) {
                _error.value = "Error al procesar la imagen: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
}
