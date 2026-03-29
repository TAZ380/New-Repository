package com.medicamentos.ui.shopping

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.repository.PatientRepository
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ShoppingViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val patientRepository = PatientRepository(db)

    private val _shoppingList = MutableLiveData<List<ShoppingItem>>()
    val shoppingList: LiveData<List<ShoppingItem>> = _shoppingList

    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val checkedItems = mutableSetOf<String>()

    fun loadShoppingList() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val allMeds = patientRepository.getAllMedicationsForShift()

                // Current time and +24h
                val now = Calendar.getInstance()
                val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
                val nowMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

                // Filter meds scheduled in next 24h (we include all since "hora" is daily)
                // Group by medication name (case-insensitive)
                val groupedByName = allMeds
                    .groupBy { (_, med) -> med.nombre.lowercase(Locale.getDefault()).trim() }

                val items = mutableListOf<ShoppingItem>()

                for ((_, group) in groupedByName) {
                    val medName = group.first().second.nombre
                    val patientNames = group
                        .map { (patient, _) -> patient.nombre }
                        .distinct()
                        .sorted()

                    // Find the earliest next-24h time
                    val times = group.mapNotNull { (_, med) ->
                        try {
                            val parts = med.hora.split(":")
                            if (parts.size == 2) {
                                parts[0].toInt() * 60 + parts[1].toInt()
                            } else null
                        } catch (e: Exception) { null }
                    }.sorted()

                    // Find next upcoming time in 24h window
                    val nextTimeMinutes = times.firstOrNull { it >= nowMinutes }
                        ?: times.firstOrNull() // wrap around to next day
                    val nextHour = if (nextTimeMinutes != null) {
                        val h = nextTimeMinutes / 60
                        val m = nextTimeMinutes % 60
                        String.format("%02d:%02d", h, m)
                    } else "00:00"

                    items.add(
                        ShoppingItem(
                            medicationName = medName,
                            totalDoses = group.size,
                            patients = patientNames,
                            nextHour = nextHour,
                            isChecked = checkedItems.contains(medName.lowercase(Locale.getDefault()))
                        )
                    )
                }

                // Sort: by nextHour time, then alphabetically by name
                val sorted = items.sortedWith(
                    compareBy(
                        { it.nextHour },
                        { it.medicationName.lowercase(Locale.getDefault()) }
                    )
                )

                _shoppingList.value = sorted
            } catch (e: Exception) {
                _shoppingList.value = emptyList()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleItem(item: ShoppingItem) {
        val key = item.medicationName.lowercase(Locale.getDefault())
        if (checkedItems.contains(key)) {
            checkedItems.remove(key)
        } else {
            checkedItems.add(key)
        }
        // Refresh list with updated checked state
        _shoppingList.value = _shoppingList.value?.map { existing ->
            if (existing.medicationName.lowercase(Locale.getDefault()) == key) {
                existing.copy(isChecked = checkedItems.contains(key))
            } else existing
        }
    }

    fun resetAllChecks() {
        checkedItems.clear()
        _shoppingList.value = _shoppingList.value?.map { it.copy(isChecked = false) }
    }
}
