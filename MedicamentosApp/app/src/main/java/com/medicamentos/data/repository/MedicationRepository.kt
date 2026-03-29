package com.medicamentos.data.repository

import android.graphics.Bitmap
import com.medicamentos.BuildConfig
import com.medicamentos.data.api.GeminiDrugInfo
import com.medicamentos.data.api.GeminiService
import com.medicamentos.data.api.RetrofitClient
import com.medicamentos.data.model.DrugDetail
import com.medicamentos.data.model.Medication
import com.medicamentos.ocr.OcrProcessor
import com.medicamentos.parser.FichaTecnicaParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MedicationRepository {

    private val cimaApi = RetrofitClient.cimaApiService
    private val gemini = GeminiService(BuildConfig.GEMINI_API_KEY)
    private val ocr = OcrProcessor()

    // ── Photo → sorted medication list ────────────────────────────────────

    suspend fun processImage(bitmap: Bitmap): List<Medication> {
        // 1. On-device OCR (ML Kit, no cost)
        val ocrText = ocr.extractText(bitmap)
        if (ocrText.isBlank()) return emptyList()

        // 2. Gemini parses unstructured text → list of {name, time}
        val medications = gemini.parseMedicationList(ocrText)
        if (medications.isEmpty()) return emptyList()

        // 3. Enrich each medication with CIMA nregistro + principio activo
        return medications
            .map { med -> enrichWithCima(med) }
            .sortedBy { it.hora }
    }

    private suspend fun enrichWithCima(med: Medication): Medication {
        return try {
            val result = searchCima(med.nombre)
            if (result != null) {
                med.copy(
                    nregistro = result.nregistro,
                    principioActivo = result.pactivos
                )
            } else med
        } catch (e: Exception) {
            med
        }
    }

    // ── Drug detail screen ────────────────────────────────────────────────

    suspend fun getDrugDetail(name: String, nregistro: String?): DrugDetail =
        withContext(Dispatchers.IO) {
            val reg = nregistro ?: searchCima(name)?.nregistro
            ?: return@withContext emptyDetail(name)

            return@withContext try {
                val cima = cimaApi.getMedicamento(reg)
                val html = FichaTecnicaParser.fetchHtml(reg)
                val geminiInfo: GeminiDrugInfo = if (html.isNotBlank()) {
                    gemini.extractDrugInfo(html)
                } else {
                    GeminiDrugInfo()
                }

                DrugDetail(
                    nombre = cima.nombre.ifBlank { name },
                    nregistro = reg,
                    principioActivo = cima.pactivos ?: "No especificado",
                    grupoTerapeutico = cima.atc?.firstOrNull()?.nombre ?: "No especificado",
                    codigoAtc = cima.atc?.firstOrNull()?.codigo ?: "-",
                    formaFarmaceutica = cima.formaFarmaceutica?.nombre ?: "No especificada",
                    viasAdministracion = cima.viasAdministracion?.map { it.nombre } ?: emptyList(),
                    laboratorio = cima.laboTitular ?: "No especificado",
                    mecanismoAccion = geminiInfo.mecanismoAccion,
                    efectosAdversos = geminiInfo.efectosAdversos,
                    diluyentes = geminiInfo.diluyentes,
                    concentracionMaxima = geminiInfo.concentracionMaxima
                )
            } catch (e: Exception) {
                emptyDetail(name)
            }
        }

    // ── Helpers ───────────────────────────────────────────────────────────

    private suspend fun searchCima(name: String) = try {
        // Try commercial name first
        var r = cimaApi.searchByNombre(name, tamanioPagina = 3)
        if (r.resultados.isNotEmpty()) r.resultados.first()
        else {
            // Fallback: try as principio activo
            r = cimaApi.searchByPrincipioActivo(name, tamanioPagina = 3)
            r.resultados.firstOrNull()
        }
    } catch (e: Exception) {
        null
    }

    private fun emptyDetail(name: String) = DrugDetail(
        nombre = name,
        nregistro = "",
        principioActivo = "No encontrado en CIMA",
        grupoTerapeutico = "No disponible",
        codigoAtc = "-",
        formaFarmaceutica = "No disponible",
        viasAdministracion = emptyList(),
        laboratorio = "No disponible",
        mecanismoAccion = "No disponible",
        efectosAdversos = "No disponible",
        diluyentes = "No disponible",
        concentracionMaxima = "No disponible"
    )
}
