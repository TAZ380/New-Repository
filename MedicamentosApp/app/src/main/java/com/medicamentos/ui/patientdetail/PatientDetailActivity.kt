package com.medicamentos.ui.patientdetail

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.snackbar.Snackbar
import com.medicamentos.databinding.ActivityPatientDetailBinding
import com.medicamentos.ui.drugdetail.DrugDetailActivity
import com.medicamentos.ui.medicationlist.MedicationAdapter

class PatientDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPatientDetailBinding
    private val viewModel: PatientDetailViewModel by viewModels()
    private lateinit var adapter: MedicationAdapter

    private lateinit var patientId: String
    private lateinit var patientName: String
    private lateinit var patientCama: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPatientDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        patientId = intent.getStringExtra(EXTRA_PATIENT_ID) ?: run {
            finish()
            return
        }
        patientName = intent.getStringExtra(EXTRA_PATIENT_NAME) ?: "Paciente"
        patientCama = intent.getStringExtra(EXTRA_PATIENT_CAMA) ?: "?"

        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = patientName
            subtitle = "Cama $patientCama"
        }

        setupRecyclerView()
        observeViewModel()

        // Load medications and observe via Flow for live updates
        viewModel.observeMedications(patientId).observe(this) { meds ->
            adapter.submitList(meds)
            val isEmpty = meds.isNullOrEmpty()
            binding.emptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
            binding.recyclerView.visibility = if (isEmpty) View.GONE else View.VISIBLE
        }
    }

    private fun setupRecyclerView() {
        adapter = MedicationAdapter { medication ->
            startActivity(
                Intent(this, DrugDetailActivity::class.java).apply {
                    putExtra(DrugDetailActivity.EXTRA_NAME, medication.nombre)
                    putExtra(DrugDetailActivity.EXTRA_NREGISTRO, medication.nregistro)
                }
            )
        }
        binding.recyclerView.adapter = adapter
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(this) { msg ->
            msg?.let {
                Snackbar.make(binding.root, it, Snackbar.LENGTH_LONG).show()
                viewModel.clearError()
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressedDispatcher.onBackPressed()
        return true
    }

    companion object {
        const val EXTRA_PATIENT_ID = "extra_patient_id"
        const val EXTRA_PATIENT_NAME = "extra_patient_name"
        const val EXTRA_PATIENT_CAMA = "extra_patient_cama"
    }
}
