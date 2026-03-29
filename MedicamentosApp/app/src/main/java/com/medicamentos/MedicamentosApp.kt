package com.medicamentos

import android.app.Application
import com.medicamentos.data.db.AppDatabase
import com.medicamentos.util.PreferencesManager

class MedicamentosApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PreferencesManager.init(this)
        AppDatabase.getInstance(this) // warm up
    }
}
