package com.voiceloop

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions
import java.io.File

class GemmaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var llmInference: LlmInference? = null
    private val TAG = "GemmaLLM"
    private val modelPath = "/data/local/tmp/llm/model_version.task"
    
    private val MAX_MODEL_SIZE_MB = 1000L
    private val RECOMMENDED_MODEL_SIZE_MB = 600L
    
    override fun getName(): String = "GemmaLLM"
    
    @ReactMethod
    fun checkModelAvailability(promise: Promise) {
        Log.i(TAG, "Checking model availability...")
        
        val modelFile = File(modelPath)
        val sizeMB = if (modelFile.exists()) modelFile.length() / 1024 / 1024 else 0
        
        val result = Arguments.createMap().apply {
            putString("modelPath", modelPath)
            putBoolean("exists", modelFile.exists())
            putBoolean("readable", modelFile.canRead())
            putDouble("sizeMB", sizeMB.toDouble())
            putInt("availableCount", if (modelFile.exists() && modelFile.canRead()) 1 else 0)
            
            if (sizeMB > MAX_MODEL_SIZE_MB) {
                putString("warning", "⚠️ Model too large! ${sizeMB}MB > ${MAX_MODEL_SIZE_MB}MB. App may crash!")
                putBoolean("tooLarge", true)
            } else if (sizeMB > RECOMMENDED_MODEL_SIZE_MB) {
                putString("warning", "⚠️ Model large (${sizeMB}MB). Recommended: <${RECOMMENDED_MODEL_SIZE_MB}MB")
                putBoolean("tooLarge", false)
            } else {
                putString("warning", "✅ Model size OK (${sizeMB}MB)")
                putBoolean("tooLarge", false)
            }
        }
        
        Log.i(TAG, "Model: exists=${modelFile.exists()}, size=${sizeMB}MB")
        promise.resolve(result)
    }
    
    @ReactMethod
    fun initializeModel(promise: Promise) {
        try {
            Log.i(TAG, "Starting model initialization...")
            
            val modelFile = File(modelPath)
            if (!modelFile.exists()) {
                promise.reject("NO_MODEL", "Model not found at $modelPath")
                return
            }
            
            val sizeMB = modelFile.length() / 1024 / 1024
            Log.i(TAG, "Model file found: ${sizeMB}MB")
            
            if (sizeMB > MAX_MODEL_SIZE_MB) {
                promise.reject("MODEL_TOO_LARGE", 
                    "Model too large: ${sizeMB}MB > ${MAX_MODEL_SIZE_MB}MB. " +
                    "Please use Gemma-3 1B (~529MB) instead of larger models.")
                return
            }
            
            if (sizeMB > RECOMMENDED_MODEL_SIZE_MB) {
                Log.w(TAG, "⚠️ Large model detected: ${sizeMB}MB. This may cause performance issues.")
            }
            
            val options = LlmInferenceOptions.builder()
                .setModelPath(modelPath)
                .setMaxTopK(40)
                .setMaxTokens(512)
                .build()
            
            Log.i(TAG, "Creating LlmInference instance...")
            
            val startTime = System.currentTimeMillis()
            llmInference = LlmInference.createFromOptions(reactApplicationContext, options)
            val initTime = System.currentTimeMillis() - startTime
            
            Log.i(TAG, "✅ Model initialized successfully in ${initTime}ms")
            
            val result = Arguments.createMap().apply {
                putString("modelPath", modelPath)
                putDouble("modelSizeMB", sizeMB.toDouble())
                putDouble("initTimeMs", initTime.toDouble())
                putString("status", "Model initialized successfully")
                putString("recommendation", if (sizeMB > RECOMMENDED_MODEL_SIZE_MB) 
                    "Consider using smaller model for better performance" else 
                    "Model size optimal for mobile")
            }
            
            promise.resolve(result)
            
        } catch (e: OutOfMemoryError) {
            Log.e(TAG, "❌ Out of memory during model initialization", e)
            promise.reject("OUT_OF_MEMORY", 
                "Out of memory! Model too large for device. Use Gemma-3 1B (~529MB) instead.")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to initialize model", e)
            promise.reject("INIT_ERROR", "Failed to initialize: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun generateResponse(prompt: String, promise: Promise) {
        try {
            if (llmInference == null) {
                promise.reject("NOT_INITIALIZED", "Model not initialized")
                return
            }
            
            Log.i(TAG, "Generating response (${prompt.length} chars)...")
            
            val startTime = System.currentTimeMillis()
            val result = llmInference!!.generateResponse(prompt)
            val genTime = System.currentTimeMillis() - startTime
            
            Log.i(TAG, "✅ Response generated in ${genTime}ms (${result.length} chars)")
            promise.resolve(result)
            
        } catch (e: OutOfMemoryError) {
            Log.e(TAG, "❌ Out of memory during generation", e)
            promise.reject("OUT_OF_MEMORY", "Out of memory during generation. Try shorter prompt.")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to generate response", e)
            promise.reject("GENERATION_ERROR", "Failed to generate: ${e.message}", e)
        }
    }
    
    @ReactMethod 
    fun generateResponseAsync(prompt: String) {
        try {
            if (llmInference == null) {
                sendEvent("llmError", "Model not initialized")
                return
            }
            
            Log.i(TAG, "Starting async generation...")
            
            Thread {
                try {
                    val result = llmInference!!.generateResponse(prompt)
                    
                    val params = Arguments.createMap().apply {
                        putString("text", result)
                        putBoolean("done", true)
                    }
                    sendEvent("llmResponse", params)
                    
                } catch (e: OutOfMemoryError) {
                    Log.e(TAG, "OOM in async generation", e)
                    sendEvent("llmError", "Out of memory. Try shorter prompt.")
                } catch (e: Exception) {
                    Log.e(TAG, "Error in async generation", e)
                    sendEvent("llmError", "Generation failed: ${e.message}")
                }
            }.start()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start async generation", e)
            sendEvent("llmError", "Async generation failed: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getSetupInstructions(promise: Promise) {
        val instructions = """
            📱 Korrektes Gemma-3 Setup:
            
            ❌ Problem: Aktuelles Model ist 3GB (zu groß!)
            ✅ Lösung: Gemma-3 1B verwenden (~529MB)
            
            1️⃣ Richtiges Model herunterladen:
               https://huggingface.co/litert-community/Gemma3-1B-IT
               (Dateigröße sollte ~529MB sein, nicht 3GB!)
            
            2️⃣ Aktuelles Model entfernen:
               adb shell rm -r /data/local/tmp/llm/
               adb shell mkdir -p /data/local/tmp/llm/
            
            3️⃣ Richtiges Model pushen:
               adb push gemma3_1b.task $modelPath
            
            4️⃣ Größe verifizieren:
               adb shell ls -lh /data/local/tmp/llm/
               (sollte ~529MB zeigen)
            
            💡 Empfehlung: 
               - Verwenden Sie IMMER Gemma-3 1B für mobile Apps
               - Größere Models (2B+) sind für Server gedacht
               - 529MB ist optimal für Android-Geräte
        """.trimIndent()
        
        promise.resolve(instructions)
    }
    
    @ReactMethod
    fun getMemoryInfo(promise: Promise) {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory() / 1024 / 1024  // MB
        val totalMemory = runtime.totalMemory() / 1024 / 1024  // MB
        val freeMemory = runtime.freeMemory() / 1024 / 1024  // MB
        val usedMemory = totalMemory - freeMemory
        
        val result = Arguments.createMap().apply {
            putDouble("maxMemoryMB", maxMemory.toDouble())
            putDouble("totalMemoryMB", totalMemory.toDouble())
            putDouble("usedMemoryMB", usedMemory.toDouble())
            putDouble("freeMemoryMB", freeMemory.toDouble())
            putDouble("memoryUsagePercent", (usedMemory.toDouble() / maxMemory.toDouble()) * 100)
        }
        
        Log.i(TAG, "Memory: ${usedMemory}MB used / ${maxMemory}MB max (${((usedMemory.toDouble()/maxMemory.toDouble())*100).toInt()}%)")
        promise.resolve(result)
    }
    
    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            llmInference?.close()
            llmInference = null
            
            System.gc()
            
            Log.i(TAG, "✅ Model cleaned up and memory freed")
            promise.resolve("Cleaned up successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cleanup", e)
            promise.reject("CLEANUP_ERROR", "Cleanup failed: ${e.message}", e)
        }
    }
    
    private fun sendEvent(eventName: String, data: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}