package com.example.todolist.api

import com.example.todolist.model.TodoItem
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface TodoApiService {
    @GET("tasks")
    suspend fun getTasks(): List<TodoItem>

    @POST("tasks")
    suspend fun createTask(@Body task: TodoItem): TodoItem

    @PUT("tasks/{id}")
    suspend fun updateTask(@Path("id") id: Long, @Body task: TodoItem): TodoItem

    @DELETE("tasks/{id}")
    suspend fun deleteTask(@Path("id") id: Long)
}

object TodoApi {
    private const val BASE_URL = "http://192.168.68.227:5000/api/"

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val service: TodoApiService by lazy {
        retrofit.create(TodoApiService::class.java)
    }
}
