package com.medicamentos.util

import android.content.Context
import android.content.SharedPreferences

object PreferencesManager {

    private const val PREF_NAME = "medicamentos_prefs"
    private const val KEY_GEMINI_API_KEY = "gemini_api_key"
    private const val KEY_USER_NAME = "user_name"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = context.applicationContext
            .getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    // ── Gemini API Key ────────────────────────────────────────────────────

    fun getGeminiApiKey(): String = prefs.getString(KEY_GEMINI_API_KEY, "") ?: ""

    fun saveGeminiApiKey(key: String) {
        prefs.edit().putString(KEY_GEMINI_API_KEY, key.trim()).apply()
    }

    fun hasGeminiApiKey(): Boolean = getGeminiApiKey().isNotBlank()

    // ── User name (optional) ──────────────────────────────────────────────

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "") ?: ""

    fun saveUserName(name: String) {
        prefs.edit().putString(KEY_USER_NAME, name.trim()).apply()
    }

    // ── Clear all (logout/reset) ──────────────────────────────────────────

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
