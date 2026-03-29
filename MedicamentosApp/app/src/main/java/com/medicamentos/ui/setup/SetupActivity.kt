package com.medicamentos.ui.setup

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.medicamentos.MainActivity
import com.medicamentos.databinding.ActivitySetupBinding
import com.medicamentos.util.PreferencesManager

class SetupActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupBinding

    /** True when opened from Settings (key already saved) */
    private var isEditing = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        isEditing = intent.getBooleanExtra(EXTRA_EDITING, false)

        if (isEditing) {
            binding.btnCancel.visibility = View.VISIBLE
            binding.tvTitle.text = "Cambiar clave Gemini"
            binding.tvSubtitle.text = "Actualiza tu clave de API de Gemini"
            // Pre-fill existing values
            binding.etApiKey.setText(PreferencesManager.getGeminiApiKey())
            binding.etUserName.setText(PreferencesManager.getUserName())
        }

        binding.btnSave.setOnClickListener { save() }
        binding.btnCancel.setOnClickListener { finish() }
    }

    private fun save() {
        val apiKey = binding.etApiKey.text?.toString()?.trim() ?: ""
        val userName = binding.etUserName.text?.toString()?.trim() ?: ""

        if (apiKey.isBlank()) {
            binding.tilApiKey.error = "La clave de API es obligatoria"
            return
        }
        binding.tilApiKey.error = null

        PreferencesManager.saveGeminiApiKey(apiKey)
        if (userName.isNotBlank()) PreferencesManager.saveUserName(userName)

        if (isEditing) {
            Toast.makeText(this, "Clave actualizada", Toast.LENGTH_SHORT).show()
            finish()
        } else {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }

    companion object {
        const val EXTRA_EDITING = "extra_editing"
    }
}
