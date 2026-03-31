package com.medicamentos

import android.app.Application
import com.medicamentos.data.db.AppDatabase

class MedicamentosApp : Application() {
    override fun onCreate() {
        super.onCreate()
        AppDatabase.getInstance(this) // warm up Room DB on startup
    }
}
