package com.medicamentos.data.api

data class CimaMedicamentosResponse(
    val totalFilas: Int = 0,
    val pagina: Int = 1,
    val tamanioPagina: Int = 25,
    val resultados: List<CimaMedicamento> = emptyList()
)

data class CimaMedicamento(
    val nregistro: String = "",
    val nombre: String = "",
    val pactivos: String? = null,
    val laboTitular: String? = null,
    val formaFarmaceutica: FormaFarmaceutica? = null,
    val viasAdministracion: List<ViaAdministracion>? = null,
    val atc: List<Atc>? = null,
    val docs: List<CimaDoc>? = null,
    val estado: Estado? = null
)

data class FormaFarmaceutica(val nombre: String = "")
data class ViaAdministracion(val nombre: String = "")
data class Atc(val codigo: String = "", val nombre: String = "")
data class CimaDoc(val tipo: Int = 0, val url: String = "", val urlHtml: String? = null)
data class Estado(val aut: String? = null, val comerc: Boolean? = null)
