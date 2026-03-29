package com.medicamentos.ui.shopping

import android.graphics.Paint
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.medicamentos.databinding.ItemShoppingBinding

class ShoppingAdapter(
    private val onCheckedChange: (ShoppingItem) -> Unit
) : ListAdapter<ShoppingItem, ShoppingAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemShoppingBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    inner class ViewHolder(private val b: ItemShoppingBinding) :
        RecyclerView.ViewHolder(b.root) {

        fun bind(item: ShoppingItem) {
            // Prevent feedback loop while setting checked state
            b.checkbox.setOnCheckedChangeListener(null)
            b.checkbox.isChecked = item.isChecked

            // Strikethrough when checked
            val flags = if (item.isChecked) {
                b.tvMedName.paintFlags or Paint.STRIKE_THRU_TEXT_FLAG
            } else {
                b.tvMedName.paintFlags and Paint.STRIKE_THRU_TEXT_FLAG.inv()
            }
            b.tvMedName.paintFlags = flags
            b.tvDoseCount.paintFlags = flags

            b.tvMedName.text = item.medicationName
            b.tvTime.text = item.nextHour
            b.tvDoseCount.text = "×${item.totalDoses} dosis"
            b.tvPatients.text = item.patients.joinToString(", ")

            // Alpha for checked items
            b.root.alpha = if (item.isChecked) 0.5f else 1.0f

            b.checkbox.setOnCheckedChangeListener { _, _ ->
                onCheckedChange(item)
            }

            b.root.setOnClickListener {
                b.checkbox.isChecked = !b.checkbox.isChecked
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<ShoppingItem>() {
        override fun areItemsTheSame(old: ShoppingItem, new: ShoppingItem) =
            old.medicationName == new.medicationName

        override fun areContentsTheSame(old: ShoppingItem, new: ShoppingItem) = old == new
    }
}
