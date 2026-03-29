package com.medicamentos.ui.beds

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.medicamentos.data.model.Patient
import com.medicamentos.databinding.FragmentBedsBinding
import com.medicamentos.ui.patientdetail.PatientDetailActivity

class BedsFragment : Fragment() {

    private var _binding: FragmentBedsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: BedsViewModel by viewModels()
    private lateinit var adapter: PatientCardAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBedsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupFab()
        observeViewModel()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun setupRecyclerView() {
        adapter = PatientCardAdapter(
            onItemClick = { patient -> openPatientDetail(patient) },
            onItemLongClick = { patient ->
                showDeleteConfirmation(patient)
                true
            }
        )
        binding.recyclerView.layoutManager = GridLayoutManager(requireContext(), 2)
        binding.recyclerView.adapter = adapter
    }

    private fun setupFab() {
        binding.fabAddPatient.setOnClickListener {
            showAddPatientSheet()
        }
    }

    private fun observeViewModel() {
        viewModel.patients.observe(viewLifecycleOwner) { patients ->
            adapter.submitList(patients)
            val isEmpty = patients.isNullOrEmpty()
            binding.emptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
            binding.recyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            msg?.let {
                showSnack(it)
                viewModel.clearError()
            }
        }
    }

    private fun openPatientDetail(patient: Patient) {
        val intent = Intent(requireContext(), PatientDetailActivity::class.java).apply {
            putExtra(PatientDetailActivity.EXTRA_PATIENT_ID, patient.id)
            putExtra(PatientDetailActivity.EXTRA_PATIENT_NAME, patient.nombre)
            putExtra(PatientDetailActivity.EXTRA_PATIENT_CAMA, patient.numeroCama)
        }
        startActivity(intent)
    }

    private fun showDeleteConfirmation(patient: Patient) {
        AlertDialog.Builder(requireContext())
            .setTitle("Eliminar paciente")
            .setMessage("¿Eliminar a '${patient.nombre}' (Cama ${patient.numeroCama}) y todos sus medicamentos?")
            .setPositiveButton("Eliminar") { _, _ ->
                viewModel.deletePatient(patient)
                showSnack("Paciente eliminado")
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showAddPatientSheet() {
        val sheet = AddPatientBottomSheet()
        sheet.show(childFragmentManager, AddPatientBottomSheet.TAG)
    }

    private fun showSnack(msg: String) {
        view?.let { Snackbar.make(it, msg, Snackbar.LENGTH_LONG).show() }
    }
}
