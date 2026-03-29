package com.medicamentos.ui.drugdetail

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.medicamentos.data.model.DrugDetail
import com.medicamentos.databinding.ActivityDrugDetailBinding

class DrugDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDrugDetailBinding
    private val viewModel: DrugDetailViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDrugDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val name = intent.getStringExtra(EXTRA_NAME) ?: ""
        val nregistro = intent.getStringExtra(EXTRA_NREGISTRO)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = name
        }

        observeViewModel()
        viewModel.loadDrugDetail(name, nregistro)
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { loading ->
            binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            binding.scrollContent.visibility = if (loading) View.GONE else View.VISIBLE
        }

        viewModel.drugDetail.observe(this) { detail ->
            detail?.let { bind(it) }
        }

        viewModel.error.observe(this) { msg ->
            if (msg != null) {
                binding.tvError.text = msg
                binding.tvError.visibility = View.VISIBLE
            }
        }
    }

    private fun bind(d: DrugDetail) {
        binding.tvNombreCompleto.text = d.nombre
        binding.tvPrincipioActivo.text = d.principioActivo
        binding.tvLaboratorio.text = d.laboratorio

        binding.tvGrupoTerapeutico.text =
            if (d.codigoAtc != "-") "${d.grupoTerapeutico} · ${d.codigoAtc}"
            else d.grupoTerapeutico

        binding.tvFormaFarmaceutica.text = d.formaFarmaceutica

        binding.tvViasAdministracion.text = d.viasAdministracion
            .joinToString("\n") { "• $it" }
            .ifEmpty { "No especificado" }

        binding.tvMecanismoAccion.text = d.mecanismoAccion
        binding.tvEfectosAdversos.text = d.efectosAdversos
        binding.tvDiluyentes.text = d.diluyentes
        binding.tvConcentracionMaxima.text = d.concentracionMaxima
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressedDispatcher.onBackPressed()
        return true
    }

    companion object {
        const val EXTRA_NAME = "extra_medication_name"
        const val EXTRA_NREGISTRO = "extra_nregistro"
    }
}
