package com.medicamentos.data.api

import retrofit2.http.GET
import retrofit2.http.Query

interface CimaApiService {

    /** Search by commercial name */
    @GET("medicamentos")
    suspend fun searchByNombre(
        @Query("nombre") nombre: String,
        @Query("pagina") pagina: Int = 1,
        @Query("tamanioPagina") tamanioPagina: Int = 5
    ): CimaMedicamentosResponse

    /** Search by active ingredient (principio activo) */
    @GET("medicamentos")
    suspend fun searchByPrincipioActivo(
        @Query("pactivo") pactivo: String,
        @Query("pagina") pagina: Int = 1,
        @Query("tamanioPagina") tamanioPagina: Int = 5
    ): CimaMedicamentosResponse

    /** Get full medication detail by registration number */
    @GET("medicamento")
    suspend fun getMedicamento(
        @Query("nregistro") nregistro: String
    ): CimaMedicamento
}
