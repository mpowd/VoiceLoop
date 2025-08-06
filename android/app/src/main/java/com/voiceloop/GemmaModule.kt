package com.voiceloop

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import java.io.File
import kotlinx.coroutines.*

class GemmaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var llmInference: LlmInference? = null
    private var llmSession: LlmInferenceSession? = null
    private val TAG = "GemmaLLM"
    private val modelPath = "/data/local/tmp/llm/gemma3n.task"
    
    private val moduleScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    
    // Store session options for recreation
    private var sessionOptions: LlmInferenceSession.LlmInferenceSessionOptions? = null
    
    override fun getName(): String = "GemmaLLM"
    
    @ReactMethod
    fun checkModelAvailability(promise: Promise) {
        Log.i(TAG, "Checking model availability at: $modelPath")
        
        try {
            val modelFile = File(modelPath)
            val sizeMB = if (modelFile.exists()) modelFile.length() / 1024 / 1024 else 0
            
            val runtime = Runtime.getRuntime()
            val maxMemoryMB = runtime.maxMemory() / 1024 / 1024
            val freeMemoryMB = runtime.freeMemory() / 1024 / 1024
            
            val result = Arguments.createMap().apply {
                putString("modelPath", modelPath)
                putBoolean("exists", modelFile.exists())
                putBoolean("readable", modelFile.canRead())
                putDouble("sizeMB", sizeMB.toDouble())
                putInt("availableCount", if (modelFile.exists() && modelFile.canRead()) 1 else 0)
                
                putDouble("maxMemoryMB", maxMemoryMB.toDouble())
                putDouble("freeMemoryMB", freeMemoryMB.toDouble())
                
                putBoolean("canLoad", modelFile.exists() && freeMemoryMB > sizeMB * 0.3)
                putString("modelType", if (sizeMB > 2000) "Large Model (3B+)" else "Standard Model")
            }
            
            Log.i(TAG, "Model check: exists=${modelFile.exists()}, size=${sizeMB}MB")
            promise.resolve(result)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error checking model", e)
            promise.reject("CHECK_ERROR", "Failed to check: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun initializeModel(promise: Promise) {
        Log.i(TAG, "=== CLEAN MODEL INITIALIZATION (NO STATUS EVENTS) ===")
        
        moduleScope.launch {
            try {           
                val modelFile = File(modelPath)
                if (!modelFile.exists()) {
                    withContext(Dispatchers.Main) {
                        promise.reject("NO_MODEL", "Model not found at $modelPath")
                    }
                    return@launch
                }
                
                val sizeMB = modelFile.length() / 1024 / 1024
                Log.i(TAG, "Large model file: ${sizeMB}MB (no status events sent)")
                
                // Memory cleanup before loading (silent)
                System.gc()
                delay(500)
                System.gc()
                
                Log.i(TAG, "Configuring model options silently...")
                
                val options = LlmInferenceOptions.builder()
                    .setModelPath(modelPath)
                    .setMaxTokens(2048)
                    .setPreferredBackend(LlmInference.Backend.GPU)
                    .build()
                
                Log.i(TAG, "Loading large model silently (no UI notifications)...")
                val startTime = System.currentTimeMillis()
                
                llmInference = withContext(Dispatchers.IO) {
                    LlmInference.createFromOptions(reactApplicationContext, options)
                }
                
                Log.i(TAG, "Creating LlmInferenceSession...")
                
                // Store session options for recreation
                sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
                    .setTopK(20)
                    .setTopP(0.8f)
                    .setTemperature(0.8f)
                    .build()
                
                llmSession = LlmInferenceSession.createFromOptions(
                    llmInference!!,
                    sessionOptions!!
                )
                
                val initTime = System.currentTimeMillis() - startTime
                
                Log.i(TAG, "✅ Large model initialized successfully in ${initTime}ms (silent mode)")
                
                val result = Arguments.createMap().apply {
                    putString("modelPath", modelPath)
                    putDouble("modelSizeMB", sizeMB.toDouble())
                    putDouble("initTimeMs", initTime.toDouble())
                    putString("status", "Model initialized successfully")
                    putString("architecture", "Silent initialization")
                }
                
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
                
            } catch (e: OutOfMemoryError) {
                Log.e(TAG, "❌ OOM during large model loading", e)
                
                // Cleanup on failure
                try {
                    llmSession?.close()
                    llmInference?.close()
                    llmSession = null
                    llmInference = null
                    sessionOptions = null
                    System.gc()
                } catch (cleanupError: Exception) {
                    Log.e(TAG, "Cleanup error", cleanupError)
                }
                
                withContext(Dispatchers.Main) {
                    promise.reject("OUT_OF_MEMORY", 
                        "Out of memory loading ${File(modelPath).length() / 1024 / 1024}MB model! " +
                        "Close other apps and restart device.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Large model initialization failed", e)
                
                withContext(Dispatchers.Main) {
                    promise.reject("INIT_ERROR", "Silent init failed: ${e.message}", e)
                }
            }
        }
    }
    
    @ReactMethod
    fun generateResponse(prompt: String, promise: Promise) {
        if (llmSession == null) {
            promise.reject("NOT_INITIALIZED", "Model session not initialized")
            return
        }
        
        moduleScope.launch {
            try {
                Log.i(TAG, "Sync generation...")
                
                val startTime = System.currentTimeMillis()
                
                withContext(Dispatchers.IO) {
                    llmSession!!.addQueryChunk(prompt)
                    val result = llmSession!!.generateResponse()
                    
                    val genTime = System.currentTimeMillis() - startTime
                    Log.i(TAG, "✅ Generated in ${genTime}ms")
                    
                    withContext(Dispatchers.Main) {
                        promise.resolve(result)
                    }
                }
                
            } catch (e: OutOfMemoryError) {
                Log.e(TAG, "OOM during generation", e)
                withContext(Dispatchers.Main) {
                    promise.reject("OUT_OF_MEMORY", "Generation OOM")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Generation failed", e)
                withContext(Dispatchers.Main) {
                    promise.reject("GENERATION_ERROR", "Failed: ${e.message}", e)
                }
            }
        }
    }
    
    @ReactMethod 
    fun generateResponseAsync(prompt: String) {
        if (llmSession == null) {
            val errorParams = Arguments.createMap().apply {
                putString("text", "")
                putBoolean("done", true)
                putBoolean("error", true)
                putString("errorMessage", "Model session not initialized")
                putString("type", "error")
            }
            sendEvent("llmResponse", errorParams)
            return
        }
        
        Log.i(TAG, "Starting isolated async streaming generation...")
        
        moduleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    llmSession!!.addQueryChunk(prompt)
                    
                    llmSession!!.generateResponseAsync { partialResult, done ->
                        Log.d(TAG, "Isolated result: done=$done, length=${partialResult.length}")
                        
                        val params = Arguments.createMap().apply {
                            putString("text", partialResult)
                            putBoolean("done", done)
                            putBoolean("error", false)
                            putString("type", "translation")
                        }
                        sendEvent("llmResponse", params)
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Isolated async generation failed", e)
                
                // Send structured error response
                val errorParams = Arguments.createMap().apply {
                    putString("text", "")
                    putBoolean("done", true)
                    putBoolean("error", true)
                    putString("errorMessage", "Async generation failed: ${e.message}")
                    putString("type", "error")
                }
                sendEvent("llmResponse", errorParams)
            }
        }
    }
    
    @ReactMethod
    fun resetSession(promise: Promise) {
        Log.i(TAG, "🔄 Resetting session for isolated translation...")
        
        moduleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    // Close current session to clear context
                    llmSession?.close()
                    
                    // Small delay to ensure cleanup
                    delay(100)
                    
                    // Create fresh session with same options
                    if (llmInference != null && sessionOptions != null) {
                        llmSession = LlmInferenceSession.createFromOptions(
                            llmInference!!,
                            sessionOptions!!
                        )
                        Log.i(TAG, "✅ Fresh session created for isolated translation")
                    } else {
                        throw Exception("Cannot recreate session - missing inference or options")
                    }
                }
                
                withContext(Dispatchers.Main) {
                    promise.resolve("Session reset successfully")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Session reset failed", e)
                withContext(Dispatchers.Main) {
                    promise.reject("RESET_ERROR", "Session reset failed: ${e.message}", e)
                }
            }
        }
    }
    
    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            Log.i(TAG, "Full cleanup (shutdown)...")
            
            // Cancel coroutines
            moduleScope.coroutineContext.cancelChildren()
            
            llmSession?.close()
            llmSession = null
            
            llmInference?.close()
            llmInference = null
            
            sessionOptions = null
            
            System.gc()
            
            Log.i(TAG, "✅ Full cleanup completed")
            promise.resolve("Cleaned up successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Cleanup failed", e)
            promise.reject("CLEANUP_ERROR", "Cleanup failed: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun getMemoryInfo(promise: Promise) {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory() / 1024 / 1024
        val totalMemory = runtime.totalMemory() / 1024 / 1024
        val freeMemory = runtime.freeMemory() / 1024 / 1024
        val usedMemory = totalMemory - freeMemory
        
        val result = Arguments.createMap().apply {
            putDouble("maxMemoryMB", maxMemory.toDouble())
            putDouble("totalMemoryMB", totalMemory.toDouble())
            putDouble("usedMemoryMB", usedMemory.toDouble())
            putDouble("freeMemoryMB", freeMemory.toDouble())
            putDouble("memoryUsagePercent", (usedMemory.toDouble() / maxMemory.toDouble()) * 100)
        }
        
        Log.i(TAG, "Memory: ${usedMemory}MB used / ${maxMemory}MB max")
        promise.resolve(result)
    }
    
    private fun sendEvent(eventName: String, data: Any?) {
        try {
            reactApplicationContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, data)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to send event: $eventName", e)
        }
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        moduleScope.cancel()
        try {
            llmSession?.close()
            llmInference?.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error in destroy", e)
        }
    }
}