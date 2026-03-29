package com.medicamentos.ui.drugdetail

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicamentos.data.model.DrugDetail
import com.medicamentos.data.repository.MedicationRepository
import kotlinx.coroutines.launch

class DrugDetailViewModel : ViewModel() {

    private val repository = MedicationRepository()

    private val _drugDetail = MutableLiveData<DrugDetail?>()
    val drugDetail: LiveData<DrugDetail?> = _drugDetail

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    fun loadDrugDetail(medicationName: String, nregistro: String?) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val detail = repository.getDrugDetail(medicationName, nregistro)
                _drugDetail.value = detail
            } catch (e: Exception) {
                _error.value = "Error cargando información: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
