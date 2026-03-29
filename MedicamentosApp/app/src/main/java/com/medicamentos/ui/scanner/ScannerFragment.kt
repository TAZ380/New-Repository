package com.medicamentos.ui.scanner

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.model.Medication
import com.medicamentos.data.model.Patient
import com.medicamentos.data.repository.PatientRepository
import com.medicamentos.databinding.FragmentScannerBinding
import com.medicamentos.ui.drugdetail.DrugDetailActivity
import com.medicamentos.ui.medicationlist.MedicationAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

class ScannerFragment : Fragment() {

    private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ScannerViewModel by viewModels()
    private lateinit var adapter: MedicationAdapter
    private var pendingPhotoUri: Uri? = null
    private lateinit var patientRepository: PatientRepository

    // ── Launchers ────────────────────────────────────────────────────────

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchCamera() else showSnack("Permiso de cámara denegado")
    }

    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            pendingPhotoUri?.let { loadBitmapAndProcess(it) }
        }
    }

    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> uri?.let { loadBitmapAndProcess(it) } }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentScannerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val db = AppDatabase.getInstance(requireContext())
        patientRepository = PatientRepository(db)

        setupRecyclerView()
        setupButtons()
        observeViewModel()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // ── Setup ─────────────────────────────────────────────────────────────

    private fun setupRecyclerView() {
        adapter = MedicationAdapter { medication ->
            startActivity(
                Intent(requireContext(), DrugDetailActivity::class.java).apply {
                    putExtra(DrugDetailActivity.EXTRA_NAME, medication.nombre)
                    putExtra(DrugDetailActivity.EXTRA_NREGISTRO, medication.nregistro)
                }
            )
        }
        binding.recyclerView.adapter = adapter
    }

    private fun setupButtons() {
        binding.fabCamera.setOnClickListener { requestCameraAndLaunch() }
        binding.btnGallery.setOnClickListener { pickImageLauncher.launch("image/*") }
    }

    // ── Camera ────────────────────────────────────────────────────────────

    private fun requestCameraAndLaunch() {
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            launchCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun launchCamera() {
        val file = File(requireContext().externalCacheDir, "med_${System.currentTimeMillis()}.jpg")
        pendingPhotoUri = FileProvider.getUriForFile(
            requireContext(),
            "${requireContext().packageName}.fileprovider",
            file
        )
        takePictureLauncher.launch(pendingPhotoUri!!)
    }

    // ── Image processing ──────────────────────────────────────────────────

    private fun loadBitmapAndProcess(uri: Uri) {
        val bitmap: Bitmap? = requireContext().contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it)
        }
        bitmap?.let { viewModel.processImage(it) }
            ?: showSnack("No se pudo cargar la imagen")
    }

    // ── Observers ─────────────────────────────────────────────────────────

    private fun observeViewModel() {
        viewModel.isLoading.observe(viewLifecycleOwner) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.medications.observe(viewLifecycleOwner) { meds ->
            adapter.submitList(meds)
            val hasMeds = meds != null && meds.isNotEmpty()
            binding.emptyState.visibility = if (hasMeds) View.GONE else View.VISIBLE
            binding.recyclerView.visibility = if (hasMeds) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            msg?.let {
                showSnack(it)
                viewModel.clearError()
            }
        }

        // When OCR completes and we have meds, show the assign dialog
        viewModel.patientOcrResult.observe(viewLifecycleOwner) { result ->
            result ?: return@observe
            val meds = viewModel.medications.value ?: return@observe
            if (meds.isNotEmpty()) {
                showAssignPatientDialog(result.paciente, result.cama, meds)
            }
        }
    }

    // ── Assign Patient Dialog ─────────────────────────────────────────────

    private fun showAssignPatientDialog(
        suggestedName: String,
        suggestedCama: String,
        medications: List<Medication>
    ) {
        lifecycleScope.launch {
            val patients = withContext(Dispatchers.IO) {
                try {
                    val db = AppDatabase.getInstance(requireContext())
                    db.patientDao().getAllPatients().first()
                } catch (e: Exception) {
                    emptyList()
                }
            }

            val options = mutableListOf<String>()
            options.add("Crear nuevo paciente (${suggestedName}, Cama ${suggestedCama})")
            patients.forEach { p -> options.add("${p.nombre} — Cama ${p.numeroCama}") }

            AlertDialog.Builder(requireContext())
                .setTitle("Asignar medicamentos a paciente")
                .setItems(options.toTypedArray()) { _, which ->
                    if (which == 0) {
                        createNewPatientWithMeds(suggestedName, suggestedCama, medications)
                    } else {
                        val selectedPatient = patients[which - 1]
                        assignMedsToExistingPatient(selectedPatient.id, medications)
                    }
                }
                .setNegativeButton("Cancelar", null)
                .show()
        }
    }

    private fun createNewPatientWithMeds(
        nombre: String,
        cama: String,
        medications: List<Medication>
    ) {
        val patient = Patient(
            id = UUID.randomUUID().toString(),
            nombre = nombre,
            numeroCama = cama,
            colorIndex = (0..7).random()
        )
        lifecycleScope.launch {
            try {
                patientRepository.addPatient(patient, medications)
                showSnack("Paciente '${nombre}' añadido con ${medications.size} medicamentos")
                viewModel.clearResults()
            } catch (e: Exception) {
                showSnack("Error al guardar paciente: ${e.message}")
            }
        }
    }

    private fun assignMedsToExistingPatient(patientId: String, medications: List<Medication>) {
        lifecycleScope.launch {
            try {
                patientRepository.addMedicationsToPatient(patientId, medications)
                showSnack("${medications.size} medicamentos añadidos al paciente")
                viewModel.clearResults()
            } catch (e: Exception) {
                showSnack("Error al asignar medicamentos: ${e.message}")
            }
        }
    }

    private fun showSnack(msg: String) {
        view?.let { Snackbar.make(it, msg, Snackbar.LENGTH_LONG).show() }
    }
}
