package com.medicamentos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.android.material.snackbar.Snackbar
import com.medicamentos.databinding.ActivityMainBinding
import com.medicamentos.ui.drugdetail.DrugDetailActivity
import com.medicamentos.ui.main.MainViewModel
import com.medicamentos.ui.medicationlist.MedicationAdapter
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()
    private lateinit var adapter: MedicationAdapter
    private var pendingPhotoUri: Uri? = null

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        setupRecyclerView()
        setupButtons()
        observeViewModel()
    }

    // ── Setup ─────────────────────────────────────────────────────────────

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

    private fun setupButtons() {
        binding.fabCamera.setOnClickListener { requestCameraAndLaunch() }
        binding.btnGallery.setOnClickListener { pickImageLauncher.launch("image/*") }
    }

    // ── Camera ────────────────────────────────────────────────────────────

    private fun requestCameraAndLaunch() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            launchCamera()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun launchCamera() {
        val file = File(externalCacheDir, "med_${System.currentTimeMillis()}.jpg")
        pendingPhotoUri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        takePictureLauncher.launch(pendingPhotoUri!!)
    }

    // ── Image processing ──────────────────────────────────────────────────

    private fun loadBitmapAndProcess(uri: Uri) {
        val bitmap: Bitmap? = contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it)
        }
        bitmap?.let { viewModel.processImage(it) }
            ?: showSnack("No se pudo cargar la imagen")
    }

    // ── Observers ─────────────────────────────────────────────────────────

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        }

        viewModel.medications.observe(this) { meds ->
            adapter.submitList(meds)
            val hasMeds = meds.isNotEmpty()
            binding.emptyState.visibility = if (hasMeds) View.GONE else View.VISIBLE
            binding.recyclerView.visibility = if (hasMeds) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(this) { msg ->
            msg?.let {
                showSnack(it)
                viewModel.clearError()
            }
        }
    }

    private fun showSnack(msg: String) =
        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
}
