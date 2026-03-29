package com.medicamentos.ui.beds

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.snackbar.Snackbar
import com.medicamentos.BuildConfig
import com.medicamentos.data.api.GeminiService
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.data.model.Patient
import com.medicamentos.data.repository.PatientRepository
import com.medicamentos.databinding.BottomSheetAddPatientBinding
import com.medicamentos.ocr.OcrProcessor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

class AddPatientBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetAddPatientBinding? = null
    private val binding get() = _binding!!

    private lateinit var patientRepository: PatientRepository
    private val gemini = GeminiService(BuildConfig.GEMINI_API_KEY)
    private val ocr = OcrProcessor()
    private var pendingPhotoUri: Uri? = null

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchCamera() else showSnack("Permiso de cámara denegado")
    }

    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            pendingPhotoUri?.let { processPhotoForPatient(it) }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetAddPatientBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val db = AppDatabase.getInstance(requireContext())
        patientRepository = PatientRepository(db)

        binding.btnSaveManual.setOnClickListener { saveManually() }
        binding.btnDetectPhoto.setOnClickListener { requestCameraAndLaunch() }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun saveManually() {
        val nombre = binding.etNombre.text.toString().trim()
        val cama = binding.etCama.text.toString().trim()

        if (nombre.isBlank()) {
            binding.etNombre.error = "Nombre requerido"
            return
        }
        if (cama.isBlank()) {
            binding.etCama.error = "Número de cama requerido"
            return
        }

        val patient = Patient(
            id = UUID.randomUUID().toString(),
            nombre = nombre,
            numeroCama = cama,
            colorIndex = (0..7).random()
        )

        lifecycleScope.launch {
            try {
                patientRepository.addPatient(patient, emptyList())
                showSnack("Paciente '${nombre}' añadido")
                dismiss()
            } catch (e: Exception) {
                showSnack("Error al guardar: ${e.message}")
            }
        }
    }

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
        val file = File(requireContext().externalCacheDir, "patient_${System.currentTimeMillis()}.jpg")
        pendingPhotoUri = FileProvider.getUriForFile(
            requireContext(),
            "${requireContext().packageName}.fileprovider",
            file
        )
        takePictureLauncher.launch(pendingPhotoUri!!)
    }

    private fun processPhotoForPatient(uri: Uri) {
        binding.progressDetect.visibility = View.VISIBLE
        binding.btnDetectPhoto.isEnabled = false
        binding.btnSaveManual.isEnabled = false

        lifecycleScope.launch {
            try {
                val bitmap: Bitmap? = withContext(Dispatchers.IO) {
                    requireContext().contentResolver.openInputStream(uri)?.use {
                        BitmapFactory.decodeStream(it)
                    }
                }

                if (bitmap == null) {
                    showSnack("No se pudo cargar la imagen")
                    return@launch
                }

                val ocrText = withContext(Dispatchers.IO) { ocr.extractText(bitmap) }
                if (ocrText.isBlank()) {
                    showSnack("No se pudo extraer texto de la imagen")
                    return@launch
                }

                val patientData = withContext(Dispatchers.IO) { gemini.extractPatientData(ocrText) }

                // Fill fields with detected data
                binding.etNombre.setText(patientData.paciente)
                binding.etCama.setText(patientData.cama)

                showSnack("Datos detectados: ${patientData.paciente}, Cama ${patientData.cama}")

                // If medications were also detected, save patient with them directly
                if (patientData.medicamentos.isNotEmpty()) {
                    val nombre = patientData.paciente
                    val cama = patientData.cama
                    val patient = Patient(
                        id = UUID.randomUUID().toString(),
                        nombre = nombre,
                        numeroCama = cama,
                        colorIndex = (0..7).random()
                    )
                    patientRepository.addPatient(patient, patientData.medicamentos)
                    showSnack("Paciente '${nombre}' añadido con ${patientData.medicamentos.size} medicamentos")
                    dismiss()
                }

            } catch (e: Exception) {
                showSnack("Error al procesar imagen: ${e.message}")
            } finally {
                binding.progressDetect.visibility = View.GONE
                binding.btnDetectPhoto.isEnabled = true
                binding.btnSaveManual.isEnabled = true
            }
        }
    }

    private fun showSnack(msg: String) {
        view?.let { Snackbar.make(it, msg, Snackbar.LENGTH_LONG).show() }
    }

    companion object {
        const val TAG = "AddPatientBottomSheet"
    }
}
