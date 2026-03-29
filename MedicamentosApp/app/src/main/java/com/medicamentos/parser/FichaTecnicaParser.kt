package com.medicamentos.parser

import org.jsoup.Jsoup

object FichaTecnicaParser {

    /**
     * Returns the CIMA HTML ficha técnica URL for the given registration number.
     * CIMA also has PDF versions but HTML is easier to parse / send to Gemini.
     */
    fun htmlUrl(nregistro: String): String =
        "https://cima.aemps.es/cima/dochtml/ft/$nregistro/FT_$nregistro.htm"

    /**
     * Fetches the ficha técnica HTML from CIMA.
     * Returns empty string on any error (Gemini will handle gracefully).
     * Must be called from a background thread / coroutine.
     */
    fun fetchHtml(nregistro: String): String {
        return try {
            Jsoup.connect(htmlUrl(nregistro))
                .userAgent("Mozilla/5.0 (Linux; Android 12)")
                .timeout(15_000)
                .get()
                .html()
        } catch (e: Exception) {
            ""
        }
    }
}
