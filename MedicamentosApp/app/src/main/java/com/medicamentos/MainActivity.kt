package com.medicamentos

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import com.medicamentos.databinding.ActivityMainBinding
import com.medicamentos.ui.beds.BedsFragment
import com.medicamentos.ui.scanner.ScannerFragment
import com.medicamentos.ui.setup.SetupActivity
import com.medicamentos.ui.shopping.ShoppingFragment
import com.medicamentos.util.PreferencesManager

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Si no hay clave Gemini guardada → ir a SetupActivity
        if (!PreferencesManager.hasGeminiApiKey()) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)

        // Saludo con nombre de usuario si está disponible
        val name = PreferencesManager.getUserName()
        supportActionBar?.subtitle = if (name.isNotBlank()) "Hola, $name" else null

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, BedsFragment())
                .commit()
        }

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            val fragment = when (item.itemId) {
                R.id.nav_beds -> BedsFragment()
                R.id.nav_scanner -> ScannerFragment()
                R.id.nav_turno -> ShoppingFragment()
                else -> return@setOnItemSelectedListener false
            }
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, fragment)
                .commit()
            true
        }

        binding.bottomNavigation.selectedItemId = R.id.nav_beds
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                startActivity(
                    Intent(this, SetupActivity::class.java)
                        .putExtra(SetupActivity.EXTRA_EDITING, true)
                )
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
