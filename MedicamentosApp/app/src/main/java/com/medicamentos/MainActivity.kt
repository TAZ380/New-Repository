package com.medicamentos

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.medicamentos.databinding.ActivityMainBinding
import com.medicamentos.ui.beds.BedsFragment
import com.medicamentos.ui.scanner.ScannerFragment
import com.medicamentos.ui.shopping.ShoppingFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (savedInstanceState == null) {
            // Default tab: Camas
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
}
