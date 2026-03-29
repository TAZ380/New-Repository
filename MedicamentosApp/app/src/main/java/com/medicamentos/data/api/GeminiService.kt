package com.medicamentos.data.api

import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken
import com.medicamentos.data.model.Medication
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class GeminiService(private val apiKey: String) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val baseUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    // ── OCR → List<Medication> ──────────────────────────────────────────────

    suspend fun parseMedicationList(ocrText: String): List<Medication> =
        withContext(Dispatchers.IO) {
            val prompt = """
                Eres un asistente médico hospitalario experto en farmacología.
                Del siguiente texto OCR extraído de una lista de medicamentos hospitalaria,
                extrae TODOS los medicamentos con sus horas de administración.

                Devuelve ÚNICAMENTE un JSON array con este formato exacto:
                [{"nombre": "NOMBRE_FARMACO", "hora": "HH:MM"}]

                Reglas:
                - Si un fármaco aparece a varias horas, crea una entrada por cada hora.
                - Si no hay hora legible, usa "00:00".
                - El nombre debe ser exactamente como aparece en el texto (comercial o principio activo).
                - Sin explicaciones, sin markdown, solo el JSON array.

                Texto OCR:
                $ocrText
            """.trimIndent()

            val raw = callGemini(prompt)
            parseMedicationsFromJson(raw)
        }

    // ── Ficha técnica HTML → GeminiDrugInfo ───────────────────────────────

    suspend fun extractDrugInfo(fichaTecnicaHtml: String): GeminiDrugInfo =
        withContext(Dispatchers.IO) {
            // Limit to avoid exceeding free-tier token limits
            val truncated = fichaTecnicaHtml.take(20_000)
            val prompt = """
                Del siguiente HTML de ficha técnica oficial de la AEMPS (España),
                extrae la siguiente información y devuelve ÚNICAMENTE este JSON
                (sin markdown, sin explicaciones):
                {
                  "mecanismoAccion": "mecanismo de acción y efectos farmacológicos (máx 400 palabras)",
                  "efectosAdversos": "efectos adversos frecuentes e importantes (máx 400 palabras)",
                  "diluyentes": "sueros y vehículos compatibles para dilución IV (si no aplica: 'No aplica')",
                  "concentracionMaxima": "concentración máxima permitida en mg/ml u otra unidad (si no especificada: 'No especificada')",
                  "incompatibilidades": "contenido completo de la sección 6.2 Incompatibilidades de la ficha técnica (si no especificada: 'No especificadas')"
                }

                HTML:
                $truncated
            """.trimIndent()

            val raw = callGemini(prompt)
            parseDrugInfoFromJson(raw)
        }

    // ── OCR text → PatientOcrResult ────────────────────────────────────────

    suspend fun extractPatientData(ocrText: String): PatientOcrResult =
        withContext(Dispatchers.IO) {
            val prompt = """
                Eres un asistente médico hospitalario experto en farmacología.
                Del siguiente texto OCR extraído de una lista de medicamentos hospitalaria,
                extrae el nombre del paciente, el número de cama y la lista de medicamentos.

                Devuelve ÚNICAMENTE un JSON con este formato exacto:
                {
                  "paciente": "NOMBRE_PACIENTE",
                  "cama": "NUMERO_CAMA",
                  "medicamentos": [{"nombre": "NOMBRE_FARMACO", "hora": "HH:MM"}]
                }

                Reglas:
                - Si no encuentras el nombre del paciente, usa "Paciente desconocido".
                - Si no encuentras el número de cama, usa "?".
                - Si un fármaco aparece a varias horas, crea una entrada por cada hora.
                - Si no hay hora legible, usa "00:00".
                - Sin explicaciones, sin markdown, solo el JSON.

                Texto OCR:
                $ocrText
            """.trimIndent()

            val raw = callGemini(prompt)
            parsePatientDataFromJson(raw)
        }

    // ── Low-level HTTP call ────────────────────────────────────────────────

    private fun callGemini(prompt: String): String {
        val body = JsonObject().apply {
            add("contents", JsonArray().apply {
                add(JsonObject().apply {
                    add("parts", JsonArray().apply {
                        add(JsonObject().apply { addProperty("text", prompt) })
                    })
                })
            })
            add("generationConfig", JsonObject().apply {
                addProperty("temperature", 0.1)
                addProperty("maxOutputTokens", 2048)
            })
        }

        val request = Request.Builder()
            .url("$baseUrl?key=$apiKey")
            .post(body.toString().toRequestBody(jsonMediaType))
            .build()

        val response = client.newCall(request).execute()
        val bodyString = response.body?.string()
            ?: throw IllegalStateException("Empty response from Gemini")

        if (!response.isSuccessful) {
            throw IllegalStateException("Gemini HTTP ${response.code}: $bodyString")
        }

        return gson.fromJson(bodyString, JsonObject::class.java)
            .getAsJsonArray("candidates")
            ?.get(0)?.asJsonObject
            ?.getAsJsonObject("content")
            ?.getAsJsonArray("parts")
            ?.get(0)?.asJsonObject
            ?.get("text")?.asString
            ?: throw IllegalStateException("Unexpected Gemini response structure")
    }

    // ── JSON parsers ──────────────────────────────────────────────────────

    private fun parseMedicationsFromJson(raw: String): List<Medication> {
        return try {
            val cleaned = raw.replace("```json", "").replace("```", "").trim()
            val type = object : TypeToken<List<Map<String, String>>>() {}.type
            val list: List<Map<String, String>> = gson.fromJson(cleaned, type)
            list.mapNotNull { item ->
                val name = item["nombre"] ?: return@mapNotNull null
                if (name.isBlank()) return@mapNotNull null
                Medication(nombre = name, hora = item["hora"] ?: "00:00")
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun parseDrugInfoFromJson(raw: String): GeminiDrugInfo {
        return try {
            val cleaned = raw.replace("```json", "").replace("```", "").trim()
            gson.fromJson(cleaned, GeminiDrugInfo::class.java) ?: GeminiDrugInfo()
        } catch (e: Exception) {
            GeminiDrugInfo()
        }
    }

    private fun parsePatientDataFromJson(raw: String): PatientOcrResult {
        return try {
            val cleaned = raw.replace("```json", "").replace("```", "").trim()
            val jsonObj = gson.fromJson(cleaned, JsonObject::class.java)
            val paciente = jsonObj.get("paciente")?.asString ?: "Paciente desconocido"
            val cama = jsonObj.get("cama")?.asString ?: "?"
            val medsArray = jsonObj.getAsJsonArray("medicamentos")
            val medications = if (medsArray != null) {
                val type = object : TypeToken<List<Map<String, String>>>() {}.type
                val list: List<Map<String, String>> = gson.fromJson(medsArray, type)
                list.mapNotNull { item ->
                    val name = item["nombre"] ?: return@mapNotNull null
                    if (name.isBlank()) return@mapNotNull null
                    com.medicamentos.data.model.Medication(
                        nombre = name,
                        hora = item["hora"] ?: "00:00"
                    )
                }
            } else emptyList()
            PatientOcrResult(paciente = paciente, cama = cama, medicamentos = medications)
        } catch (e: Exception) {
            PatientOcrResult()
        }
    }
}

data class GeminiDrugInfo(
    val mecanismoAccion: String = "Información no disponible",
    val efectosAdversos: String = "Información no disponible",
    val diluyentes: String = "No aplica",
    val concentracionMaxima: String = "No especificada",
    val incompatibilidades: String = "No especificadas"
)

data class PatientOcrResult(
    val paciente: String = "Paciente desconocido",
    val cama: String = "?",
    val medicamentos: List<com.medicamentos.data.model.Medication> = emptyList()
)
