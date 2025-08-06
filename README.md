# VoiceLoop - on-device Translation App with Gemma 3n

**VoiceLoop** is a privacy-first, offline translation app powered by Google's Gemma 3n that enables seamless multilingual communication through both traditional single-user translation and a "Mirror Mode" for real-time face-to-face conversations between two people speaking different languages.

## 📱 Quick Download

**🚀 Want to try VoiceLoop immediately?**

👉 **[Download APK from Releases](https://github.com/mpowd/voiceloop/releases/latest)**

*Or build from source using the instructions below.*

---

## 🌟 Key Features

### 🔄 Two Translation Modes
- **Normal Mode**: Traditional single-user translation interface
- **Mirror Mode**: Face-to-face conversation interface where two people can interact naturally, with each person's interface optimally positioned for them

### 🛡️ Privacy-First Design
- **100% Offline**: All processing happens on-device using Gemma 3n
- **No Data Transmission**: Your conversations never leave your device
- **Local AI**: Powered by Google's Gemma 3n running entirely on your Android device

### 🎙️ Multimodal Experience
- **Real-time Voice Recognition**: Speech-to-text 
- **Text-to-Speech**: Hear translations in natural voices
- **Text Input**: Manual text entry with live editing

## 🏗️ Technical Architecture

### Frontend (React Native + TypeScript)
- **Component Architecture**: Modular React components with custom hooks
- **State Management**: Centralized app state with optimized re-renders
- **Platform Integration**: Deep Android integration for native performance

### Backend (Native Android - Kotlin)
- **MediaPipe Integration**: Direct integration with Google's MediaPipe LLM Inference
- **Coroutine-based Processing**: Non-blocking async operations
- **Memory Optimization**: Intelligent cleanup and garbage collection

### AI Engine
- **Gemma 3n Integration**: Local on-device inference
- **Context Management**: Session isolation for accurate translations

## 🚀 Installation & Setup

### 1. Model Installation

The app requires the Gemma 3n model file to be installed on your device at this specific location:
```
/data/local/tmp/llm/gemma3n.task
```

#### Steps to install the model:

1. **Download the model**: First, download the Gemma 3n `.task` file (e.g., from Kaggle)

2. **Install via ADB**: Use the following commands to install the model:
   ```bash
   # Remove existing model directory
   adb shell rm -r /data/local/tmp/llm/
   
   # Create the model directory
   adb shell mkdir -p /data/local/tmp/llm/
   
   # Push the model file to the device
   adb push your_model.task /data/local/tmp/llm/gemma3n.task
   ```

### 2. Language Packages Setup

VoiceLoop uses Android's built-in Google speech recognition and text-to-speech engines. You need to download language packages for the languages you want to use:

#### Speech-to-Text (STT) Language Packages:
1. Go to **Settings** → **General Management** → **Google Voice Input**
2. Select **Download Languages**
3. Download the language packages you need

#### Text-to-Speech (TTS) Language Packages:
1. Go to **Settings** → **General Management** → **Text-to-Speech**
2. Select **Google Speech Recognition and Synthesis** → **Settings**
3. Select **Install Voice Data**
4. Download the language packages you need

### 3. App Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the app: `npx react-native run-android`

## 🤔 Why Separate STT/TTS Modules?

### Audio Modality Limitation in MediaPipe Android

An important architectural decision in VoiceLoop was to use separate offline STT (Speech-to-Text) and TTS (Text-to-Speech) modules instead of relying on Gemma 3n's native audio capabilities. Here's why:

**MediaPipe Audio Inference Status**: As of the development time, MediaPipe's audio inference APIs for Android are not yet available in the Maven repository. While the audio modality is implemented in MediaPipe v0.10.26 (available on GitHub), the `tasks-genai` package with audio support has not been published to Maven, making it impossible to integrate audio inference directly with Gemma 3n in Android applications.

**Alternative Approaches Explored**:
- ❌ **MediaPipe v0.10.26**: Not published to Maven; building from source proved complex
- ❌ **LiteRT**: Requires `.tflite` files, which are not available for Gemma 3n
- ❌ **LiteRT Next**: Also requires `.tflite` files
- ❌ **LiteRT-LM**: No Kotlin/Android API support

**Our Solution**: Instead of waiting for MediaPipe's audio support, we implemented a robust architecture using:
- **Google's built-in STT engine**: Leverages Android's native speech recognition
- **Google's built-in TTS engine**: Uses Android's native text-to-speech synthesis
- **Gemma 3n for translation**: Handles the core translation logic with text-to-text processing

This approach ensures:
- ✅ **Immediate availability**: Works with current MediaPipe releases
- ✅ **High-quality audio processing**: Uses Google's mature STT/TTS engines
- ✅ **Offline functionality**: All components work without internet
- ✅ **Optimal performance**: Each component is optimized for its specific task

## 🎯 Impact & Use Cases

### Breaking Language Barriers
- **Travel**: Communicate effortlessly in foreign countries
- **Business**: Conduct international meetings without interpreters
- **Education**: Learn languages through real conversations
- **Healthcare**: Assist multilingual patients and healthcare providers
- **Emergency Response**: Critical communication during emergencies

### Accessibility Features
- **Offline Operation**: Works in areas with poor connectivity
- **Privacy Protection**: Sensitive conversations stay on your device
- **Real-time Processing**: Immediate translation for natural conversations
- **Visual Feedback**: Clear UI indicators for all interaction states

## 🔧 Technical Specifications

### Supported Features
- **Languages**: All languages supported by Gemma 3n
- **Audio**: Real-time speech recognition and synthesis
- **Performance**: Optimized for mobile devices
- **Memory**: Intelligent context management
- **UI**: Responsive design with mirror mode support

### System Requirements
- Android 8.0+ (API level 26+)
- 4GB+ RAM recommended
- 2GB+ storage for model and language packages
- Microphone and speakers for voice functionality

## 🏆 Gemma 3n Integration

VoiceLoop showcases Gemma 3n's unique capabilities:

- **On-Device Performance**: Leverages Gemma 3n's mobile-optimized architecture
- **Privacy-First**: Utilizes local processing for sensitive conversations
- **Real-time Processing**: Streaming translation with immediate feedback
- **Memory Efficiency**: Optimized session management for mobile devices
- **Multilingual Support**: Takes advantage of Gemma 3n's language capabilities

## 🚀 Future Enhancements

- **Camera Integration**: Visual context for translations
- **Conversation History**: Save and reference past translations
- **Custom Vocabularies**: Specialized terminology support
- **Group Conversations**: Multi-person translation support
- **Audio Modality**: Direct integration once MediaPipe audio APIs are available

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI Edge team for Gemma 3n and MediaPipe
- React Native community for the excellent framework

---

**Built for the Google Gemma 3n Impact Challenge** 🌟

*Empowering global communication through privacy-first, on-device AI translation.*
