package com.medicamentos.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.medicamentos.MainActivity
import com.medicamentos.databinding.ActivityAuthBinding

class AuthActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAuthBinding
    private lateinit var auth: FirebaseAuth
    private var isLoginMode = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAuthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        auth = FirebaseAuth.getInstance()

        // Si ya está logueado, ir directo a MainActivity
        if (auth.currentUser != null) {
            goToMain()
            return
        }

        binding.btnSubmit.setOnClickListener { submit() }
        binding.tvToggleMode.setOnClickListener { toggleMode() }
        binding.tvForgotPassword.setOnClickListener { resetPassword() }

        updateUi()
    }

    private fun toggleMode() {
        isLoginMode = !isLoginMode
        binding.tvError.visibility = View.GONE
        updateUi()
    }

    private fun updateUi() {
        if (isLoginMode) {
            binding.tvTitle.text = "Iniciar sesión"
            binding.tilConfirmPassword.visibility = View.GONE
            binding.btnSubmit.text = "Entrar"
            binding.tvToggleMode.text = "¿No tienes cuenta? Regístrate"
            binding.tvForgotPassword.visibility = View.VISIBLE
        } else {
            binding.tvTitle.text = "Crear cuenta"
            binding.tilConfirmPassword.visibility = View.VISIBLE
            binding.btnSubmit.text = "Registrarse"
            binding.tvToggleMode.text = "¿Ya tienes cuenta? Inicia sesión"
            binding.tvForgotPassword.visibility = View.GONE
        }
    }

    private fun submit() {
        val email = binding.etEmail.text?.toString()?.trim() ?: ""
        val password = binding.etPassword.text?.toString() ?: ""

        binding.tilEmail.error = null
        binding.tilPassword.error = null
        binding.tvError.visibility = View.GONE

        if (email.isBlank()) { binding.tilEmail.error = "Introduce tu email"; return }
        if (password.isBlank()) { binding.tilPassword.error = "Introduce tu contraseña"; return }

        if (!isLoginMode) {
            val confirm = binding.etConfirmPassword.text?.toString() ?: ""
            if (password.length < 6) { binding.tilPassword.error = "Mínimo 6 caracteres"; return }
            if (password != confirm) { showError("Las contraseñas no coinciden"); return }
        }

        setLoading(true)

        if (isLoginMode) {
            auth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    setLoading(false)
                    if (task.isSuccessful) goToMain()
                    else showError(firebaseMessage(task.exception))
                }
        } else {
            auth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    setLoading(false)
                    if (task.isSuccessful) goToMain()
                    else showError(firebaseMessage(task.exception))
                }
        }
    }

    private fun resetPassword() {
        val email = binding.etEmail.text?.toString()?.trim() ?: ""
        if (email.isBlank()) { binding.tilEmail.error = "Introduce tu email primero"; return }

        auth.sendPasswordResetEmail(email).addOnCompleteListener { task ->
            if (task.isSuccessful)
                Toast.makeText(this, "Email de recuperación enviado", Toast.LENGTH_LONG).show()
            else
                showError(firebaseMessage(task.exception))
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun showError(msg: String) {
        binding.tvError.text = msg
        binding.tvError.visibility = View.VISIBLE
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnSubmit.isEnabled = !loading
        binding.tvToggleMode.isEnabled = !loading
    }

    private fun firebaseMessage(e: Exception?): String = when (e) {
        is FirebaseAuthInvalidUserException -> "No existe una cuenta con ese email"
        is FirebaseAuthInvalidCredentialsException -> "Email o contraseña incorrectos"
        is FirebaseAuthUserCollisionException -> "Ya existe una cuenta con ese email"
        is FirebaseAuthWeakPasswordException -> "Contraseña demasiado débil (mínimo 6 caracteres)"
        else -> e?.message ?: "Error desconocido"
    }
}
