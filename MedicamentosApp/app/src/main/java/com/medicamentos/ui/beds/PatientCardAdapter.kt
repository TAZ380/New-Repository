package com.medicamentos.ui.beds

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.medicamentos.R
import com.medicamentos.data.model.Patient
import com.medicamentos.databinding.ItemPatientCardBinding

class PatientCardAdapter(
    private val onItemClick: (Patient) -> Unit,
    private val onItemLongClick: (Patient) -> Boolean
) : ListAdapter<Patient, PatientCardAdapter.ViewHolder>(DiffCallback) {

    // Pastel background colors (index maps to colorIndex % 8)
    private val pastelBgColors = intArrayOf(
        R.color.pastel_0,
        R.color.pastel_1,
        R.color.pastel_2,
        R.color.pastel_3,
        R.color.pastel_4,
        R.color.pastel_5,
        R.color.pastel_6,
        R.color.pastel_7
    )

    private val pastelTextColors = intArrayOf(
        R.color.pastel_text_0,
        R.color.pastel_text_1,
        R.color.pastel_text_2,
        R.color.pastel_text_3,
        R.color.pastel_text_4,
        R.color.pastel_text_5,
        R.color.pastel_text_6,
        R.color.pastel_text_7
    )

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemPatientCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    inner class ViewHolder(private val b: ItemPatientCardBinding) :
        RecyclerView.ViewHolder(b.root) {

        fun bind(patient: Patient) {
            val colorIdx = patient.colorIndex % 8
            val context = b.root.context

            // Background color
            val bgColor = context.getColor(pastelBgColors[colorIdx])
            val textColor = context.getColor(pastelTextColors[colorIdx])

            b.cardRoot.setCardBackgroundColor(bgColor)

            b.tvCamaNumber.text = "Cama ${patient.numeroCama}"
            b.tvCamaNumber.setTextColor(textColor)

            b.tvPatientName.text = patient.nombre
            b.tvPatientName.setTextColor(textColor)

            val medCount = patient.medications.size
            b.tvMedCount.text = context.resources.getQuantityString(
                R.plurals.medication_count,
                medCount,
                medCount
            )
            b.tvMedCount.setTextColor(textColor)

            b.root.setOnClickListener { onItemClick(patient) }
            b.root.setOnLongClickListener { onItemLongClick(patient) }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<Patient>() {
        override fun areItemsTheSame(old: Patient, new: Patient) = old.id == new.id
        override fun areContentsTheSame(old: Patient, new: Patient) = old == new
    }
}
