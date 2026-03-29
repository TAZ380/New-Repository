package com.medicamentos.ui.shopping

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.medicamentos.databinding.FragmentShoppingBinding
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ShoppingFragment : Fragment() {

    private var _binding: FragmentShoppingBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ShoppingViewModel by viewModels()
    private lateinit var adapter: ShoppingAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentShoppingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupFab()
        setupHeader()
        observeViewModel()

        viewModel.loadShoppingList()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadShoppingList()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun setupRecyclerView() {
        adapter = ShoppingAdapter { item ->
            viewModel.toggleItem(item)
        }
        binding.recyclerView.adapter = adapter
    }

    private fun setupFab() {
        binding.fabReset.setOnClickListener {
            viewModel.resetAllChecks()
        }
    }

    private fun setupHeader() {
        val now = Calendar.getInstance()
        val end = Calendar.getInstance().apply { add(Calendar.HOUR_OF_DAY, 24) }
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        val sdFull = SimpleDateFormat("dd/MM HH:mm", Locale.getDefault())
        binding.tvShiftRange.text = "Turno: ${sdf.format(now.time)} → ${sdFull.format(end.time)}"
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.shoppingList.observe(viewLifecycleOwner) { items ->
            adapter.submitList(items)
            val isEmpty = items.isNullOrEmpty()
            binding.emptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
            binding.recyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
        }
    }
}
