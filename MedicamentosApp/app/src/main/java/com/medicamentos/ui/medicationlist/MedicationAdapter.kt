package com.medicamentos.ui.medicationlist

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.medicamentos.data.model.Medication
import com.medicamentos.databinding.ItemMedicationBinding

class MedicationAdapter(
    private val onItemClick: (Medication) -> Unit
) : ListAdapter<Medication, MedicationAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemMedicationBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    inner class ViewHolder(private val b: ItemMedicationBinding) :
        RecyclerView.ViewHolder(b.root) {

        fun bind(med: Medication) {
            b.tvHora.text = med.hora
            b.tvNombre.text = med.nombre
            b.tvPrincipio.text = med.principioActivo ?: ""
            b.root.setOnClickListener { onItemClick(med) }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<Medication>() {
        override fun areItemsTheSame(old: Medication, new: Medication) =
            old.nombre == new.nombre && old.hora == new.hora

        override fun areContentsTheSame(old: Medication, new: Medication) = old == new
    }
}
