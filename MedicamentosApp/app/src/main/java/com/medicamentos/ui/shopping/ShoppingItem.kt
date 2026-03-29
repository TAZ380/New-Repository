package com.medicamentos.ui.shopping

data class ShoppingItem(
    val medicationName: String,
    val totalDoses: Int,
    val patients: List<String>, // patient names
    val nextHour: String, // earliest time today
    var isChecked: Boolean = false
)
