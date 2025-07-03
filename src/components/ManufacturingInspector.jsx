import React, { useState, useRef, useEffect } from 'react';
import { Brain, Loader2, Upload, X, MessageSquare, Send, Settings, Eye, Image, Play, AlertTriangle, CheckCircle } from 'lucide-react';

// Real implementation for Google Gemini
class RealChatGoogleGenerativeAI {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || "gemini-1.5-pro";
  }

  async invoke(messages, videoData = null, referenceImages = []) {
    if (!this.apiKey) {
      throw new Error("Google Gemini API key is required for real-time analysis");
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      
      const parts = [];
      
      // Add text prompt
      parts.push({
        text: messages[0]?.content || ANALYSIS_PROMPT_TEMPLATE
      });

      // Add reference images
      for (const img of referenceImages) {
        parts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.data
          }
        });
      }

      // Add video data if available
      if (videoData) {
        parts.push({
          inline_data: {
            mime_type: videoData.mimeType,
            data: videoData.data
          }
        });
      }

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return { 
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated" 
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

//Real implementation for OpenAI GPT-4 Vision
class RealChatOpenAI {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || "gpt-4o";
  }

  async invoke(messages, frameImages = [], referenceImages = []) {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is required for real-time analysis");
    }

    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      
      const content = [
        {
          type: "text",
          text: messages[0]?.content || ENHANCED_COMPARISON_PROMPT
        }
      ];

      // Add reference images first with clear labels
      referenceImages.forEach((img, index) => {
        content.push({
          type: "text",
          text: `\n--- REFERENCE SOP IMAGE ${index + 1}: ${img.name || 'Standard Operating Procedure'} ---`
        });
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${img.mimeType};base64,${img.data}`,
            detail: "high"
          }
        });
      });

      // Add separator for video frames
      content.push({
        type: "text",
        text: "\n--- VIDEO FRAMES FOR COMPARISON ANALYSIS ---"
      });

      // Add extracted frames with context
      frameImages.forEach((frame, index) => {
        content.push({
          type: "text",
          text: `\nVIDEO FRAME ${frame.frameNumber} (Timestamp: ${frame.formattedTime}):`
        });
        content.push({
          type: "image_url",
          image_url: {
            url: frame.dataUrl,
            detail: "high"
          }
        });
      });

      const requestBody = {
        model: this.modelName,
        messages: [{
          role: "user",
          content: content
        }],
        max_tokens: 4096,
        temperature: 0.1
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return { 
        content: data.choices?.[0]?.message?.content || "No analysis generated" 
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  }
}

const ANALYSIS_PROMPT_TEMPLATE = `
You are an expert manufacturing process inspector analyzing a production line video and reference images. Your task is to identify potential safety hazards, quality control issues, process inefficiencies, and deviations from standard operating procedures (SOPs).

Analyze the video frames and compare them against the reference images to provide:

## Manufacturing Process Analysis Report

### Executive Summary
[Brief overview of key findings and overall assessment with compliance percentage]

### 1. Safety Compliance
For each safety observation, provide:
- **Observation [Timestamp/Frame]:** [Description]
- **Severity:** [Low/Medium/High/Critical]
- **Potential Impact:** [Consequence if not addressed]
- **Recommended Action:** [Specific action to improve safety]

### 2. Process Compliance (vs. Reference Images)
For each process deviation:
- **Observation [Timestamp/Frame]:** [Description]
- **Deviation Type:** [Sequence error, Tooling error, Material handling, etc.]
- **Reference Discrepancy:** [How it differs from reference SOP]
- **Recommended Action:** [Specific corrective action]

### 3. Quality Control
For each quality issue:
- **Observation [Timestamp/Frame]:** [Description]
- **Severity:** [Minor/Moderate/Major/Critical]
- **Potential Impact:** [Customer impact]
- **Recommended Action:** [Quality improvement measure]

### 4. Efficiency and Optimization
For each efficiency opportunity:
- **Observation [Timestamp/Frame]:[Description]
- **Area for Improvement:** [Time, Material, Ergonomics, etc.]
- **Recommended Action:** [Optimization strategy]

### 5. Overall Recommendations
[Prioritized list of actionable improvements]

Be specific with timestamps, reference frame numbers, and provide measurable recommendations where possible.
`;

const ENHANCED_COMPARISON_PROMPT = `
You are an expert manufacturing quality inspector analyzing video frames against Standard Operating Procedure (SOP) reference images. 

**COMPARISON METHODOLOGY:**
1. Study the reference SOP images to understand correct procedures
2. Analyze each video frame chronologically 
3. Compare each frame against reference images to identify deviations
4. Provide specific timestamps and frame references for all observations

## 🎯 EXECUTIVE SUMMARY
- **Overall Compliance Score:** [X/100]
- **Critical Issues Found:** [Number]
- **Process Adherence:** [Percentage]

## 🔍 DETAILED FRAME-BY-FRAME COMPARISON

### Reference SOP Compliance
For each deviation:
- **Frame #[X] at [timestamp]:** [What's happening]
- **Reference Comparison:** [How it differs from SOP]
- **Deviation Severity:** [Critical/High/Medium/Low]
- **Expected vs. Actual:** [What should happen vs. what's happening]

## 🚨 SAFETY ANALYSIS
- **Frame #[X] at [timestamp]:** [Safety issue]
- **Reference Standard:** [What SOP shows for safety]
- **Risk Level:** [Critical/High/Medium/Low]
- **Immediate Action:** [Specific safety correction]

## 📊 QUALITY CONTROL ASSESSMENT
- **Frame #[X] at [timestamp]:** [Quality issue]
- **SOP Standard:** [Quality standard from reference]
- **Current Performance:** [What video shows]
- **Corrective Action:** [Specific improvement]

## ⚙️ PROCESS EFFICIENCY REVIEW
- **Frame #[X] at [timestamp]:** [Process inefficiency]
- **Standard Method:** [Efficient method from SOP]
- **Current Method:** [What's being done]
- **Optimization:** [Specific improvement]

## 🎯 PRIORITIZED RECOMMENDATIONS
1. **IMMEDIATE (Critical):** [Fix within 24 hours]
2. **SHORT-TERM (High):** [Address within 1 week]
3. **MEDIUM-TERM (Medium):** [Improve within 1 month]

## 📋 COMPLIANCE CHECKLIST
- ✅/❌ **PPE Usage:** [Personal Protective Equipment]
- ✅/❌ **Tool Positioning:** [Correct tool placement]
- ✅/❌ **Sequence Adherence:** [Following correct sequence]
- ✅/❌ **Quality Checks:** [Required inspections]
- ✅/❌ **Safety Protocols:** [Safety procedures]

Reference specific frame numbers and timestamps for ALL observations.
`;

function ManufacturingInspector() {
  const [video, setVideo] = useState(null);
  const [referenceImages, setReferenceImages] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [frameInterval, setFrameInterval] = useState(2);
  const [maxFrames, setMaxFrames] = useState(20); // New state for max frames
  const [imageQuality, setImageQuality] = useState(0.9); // New state for image quality
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analysisStats, setAnalysisStats] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please upload a video file.');
        return;
      }
      setVideo(file);
      setExtractedFrames([]);
      setAnalysis('');
      setAnalysisStats(null);
      setShowChat(false);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file: file,
      dataUrl: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type
    }));
    setReferenceImages(prev => [...prev, ...newImages]);
    setAnalysis('');
    setShowChat(false);
  };

  const removeReferenceImage = (indexToRemove) => {
    setReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const extractFramesFromVideo = async (videoFile, frameInterval, setProgress, maxFrames, imageQuality) => {
    const frames = [];
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    if (!videoElement || !canvasElement || !videoFile) {
      throw new Error("Missing video element, canvas, or file");
    }

    videoElement.src = URL.createObjectURL(videoFile);

    await new Promise(resolve => {
      videoElement.onloadedmetadata = () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        resolve();
      };
    });

    const duration = videoElement.duration;
    const totalFramesToExtract = Math.min(Math.floor(duration / frameInterval), maxFrames); 

    for (let i = 0; i < totalFramesToExtract; i++) {
      const time = i * frameInterval;
      videoElement.currentTime = time;

      await new Promise(resolve => {
        const onSeeked = () => {
          ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          const dataUrl = canvasElement.toDataURL('image/jpeg', imageQuality); 
          frames.push({ 
            dataUrl, 
            timestamp: time, 
            frameNumber: i + 1,
            formattedTime: `${Math.floor(time / 60)}:${(time % 60).toFixed(1).padStart(4, '0')}`,
            width: canvasElement.width,
            height: canvasElement.height,
            quality: imageQuality
          });
          if (setProgress) {
            setProgress(Math.floor(((i + 1) / totalFramesToExtract) * 40));
          }
          videoElement.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });
    }
    return frames;
  };

  const analyzeVideo = async () => {
    const currentApiKey = selectedProvider === 'gemini' ? geminiApiKey : openaiApiKey;
    
    if (!video || referenceImages.length === 0) {
      alert('Please upload a video and at least one reference image.');
      return;
    }

    if (!currentApiKey) {
      alert(`Please enter your ${selectedProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key in the configuration.`);
      return;
    }

    setLoading(true);
    setAnalysis('');
    setProgress(0);
    setExtractedFrames([]);
    setChatMessages([]);
    setShowChat(false);
    setAnalysisStats(null);

    try {
      // Extract frames for OpenAI or prepare video for Gemini
      let frames = [];
      let videoData = null;

      if (selectedProvider === 'openai') {
        setProgress(10);
        frames = await extractFramesFromVideo(video, frameInterval, setProgress, maxFrames, imageQuality);
        setExtractedFrames(frames);
        
        if (frames.length === 0) {
          throw new Error("No frames could be extracted from the video.");
        }
      } else {
        // For Gemini, convert video to base64
        setProgress(10);
        const videoBase64 = await fileToBase64(video);
        videoData = {
          data: videoBase64,
          mimeType: video.type
        };
        // Still extract frames for preview
        frames = await extractFramesFromVideo(video, frameInterval, setProgress, maxFrames, imageQuality);
        setExtractedFrames(frames);
      }

      setProgress(50);

      // Prepare reference images
      const refImagesData = [];
      for (const img of referenceImages) {
        const base64 = await fileToBase64(img.file);
        refImagesData.push({
          data: base64,
          mimeType: img.mimeType,
          name: img.name
        });
      }

      setProgress(70);

      // Initialize the appropriate AI service
      let llm;
      if (selectedProvider === 'gemini') {
        llm = new RealChatGoogleGenerativeAI({
          apiKey: geminiApiKey,
          modelName: "gemini-1.5-pro"
        });
      } else {
        llm = new RealChatOpenAI({
          apiKey: openaiApiKey,
          modelName: "gpt-4o"
        });
      }

      setProgress(80);

      // Perform analysis
      const result = await llm.invoke(
        [{ content: selectedProvider === 'openai' ? ENHANCED_COMPARISON_PROMPT : ANALYSIS_PROMPT_TEMPLATE }],
        selectedProvider === 'gemini' ? videoData : frames,
        refImagesData
      );

      setAnalysis(result.content);
      setProgress(100);
      
      // Extract analysis statistics
      const analysisText = result.content.toLowerCase();
      const stats = {
        safetyIssues: (analysisText.match(/critical|high.*risk|safety.*issue|danger/g) || []).length,
        qualityIssues: (analysisText.match(/quality|defect|scratch|damage|non-conformance/g) || []).length,
        processDeviations: (analysisText.match(/deviation|incorrect|wrong|error|non-compliance/g) || []).length,
        complianceScore: extractComplianceScore(analysisText),
        provider: selectedProvider,
        framesAnalyzed: frames.length,
        referenceImages: referenceImages.length
      };
      setAnalysisStats(stats);
      
      setShowChat(true);
      setChatMessages([
        { 
          role: 'assistant', 
          content: `✅ Enhanced comparison analysis complete using ${selectedProvider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4 Vision'}!\n\n📊 **Analysis Results:**\n- ${stats.framesAnalyzed} video frames analyzed\n- ${stats.referenceImages} reference SOPs compared\n- ${stats.safetyIssues} safety issues found\n- ${stats.qualityIssues} quality concerns identified\n- ${stats.processDeviations} process deviations detected\n- Compliance Score: ${stats.complianceScore}/100\n\nAsk me specific questions about any findings!`, 
          timestamp: Date.now() 
        }
      ]);

    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis(`❌ Analysis Error: ${error.message}\n\nPlease check:\n1. Your API key is correct and has sufficient credits\n2. Video and images are in supported formats\n3. Internet connection is stable\n4. API service is available`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setChatLoading(true);

    try {
      const currentApiKey = selectedProvider === 'gemini' ? geminiApiKey : openaiApiKey;
      
      if (!currentApiKey) {
        throw new Error(`${selectedProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key required for chat`);
      }

      // Create context-aware prompt
      const contextPrompt = `Based on the manufacturing analysis report below, please answer the user's question:

ANALYSIS REPORT:
${analysis}

USER QUESTION: ${userMessage}

Please provide a specific, actionable answer based on the analysis data.`;

      let llm;
      if (selectedProvider === 'gemini') {
        llm = new RealChatGoogleGenerativeAI({
          apiKey: geminiApiKey,
          modelName: "gemini-1.5-pro"
        });
      } else {
        llm = new RealChatOpenAI({
          apiKey: openaiApiKey,
          modelName: "gpt-4o"
        });
      }

      const result = await llm.invoke([{ content: contextPrompt }]);
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.content, timestamp: Date.now() }]);
      
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Chat Error: ${error.message}`, 
        timestamp: Date.now() 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper function to extract compliance score
  const extractComplianceScore = (analysisText) => {
    const scoreMatch = analysisText.match(/compliance.*score.*?(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 85; // Default score
  };

  // Enhanced quick actions based on analysis content
  const getEnhancedQuickActions = () => {
    const actions = [];
    const analysisLower = analysis.toLowerCase();
    
    if (analysisLower.includes('safety') || analysisLower.includes('critical')) {
      actions.push("What are the critical safety violations found?");
    }
    if (analysisLower.includes('quality') || analysisLower.includes('defect')) {
      actions.push("Show me the quality control issues by frame.");
    }
    if (analysisLower.includes('deviation') || analysisLower.includes('sop')) {
      actions.push("Which frames show the biggest SOP deviations?");
    }
    if (analysisLower.includes('efficiency') || analysisLower.includes('optimization')) {
      actions.push("What process optimizations are recommended?");
    }
    if (analysisLower.includes('compliance') || analysisLower.includes('score')) {
      actions.push("Explain the compliance score breakdown.");
    }
    
    return actions.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Real-Time AI Manufacturing Inspector</h1>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="ml-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 text-lg">
            Powered by Google Gemini & OpenAI GPT-4 Vision • Real-time manufacturing process analysis
          </p>
          {analysisStats && (
            <div className="mt-4 flex justify-center gap-4">
              <div className="bg-red-100 px-3 py-1 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {analysisStats.safetyIssues} Safety Issues
              </div>
              <div className="bg-yellow-100 px-3 py-1 rounded-full text-sm">
                {analysisStats.qualityIssues} Quality Concerns
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                {analysisStats.processDeviations} Process Deviations
              </div>
              <div className="bg-green-100 px-3 py-1 rounded-full text-sm">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {analysisStats.provider.toUpperCase()} (Compliance: {analysisStats.complianceScore}%)
              </div>
            </div>
          )}
        </header>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="gemini">Google Gemini (Recommended for Video)</option>
                  <option value="openai">OpenAI GPT-4 Vision</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Frame Interval (seconds)</label>
                <input
                  type="number"
                  value={frameInterval}
                  onChange={(e) => setFrameInterval(Number(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Frames to Analyze</label>
                <select
                  value={maxFrames}
                  onChange={(e) => setMaxFrames(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="10">10 frames (Fast)</option>
                  <option value="15">15 frames (Balanced)</option>
                  <option value="20">20 frames (Detailed)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image Quality</label>
                <select
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="0.8">Standard Quality</option>
                  <option value="0.9">High Quality</option>
                  <option value="0.95">Maximum Quality</option>
                </select>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Gemini API Key
                  <span className="text-green-600 ml-2">
                    {selectedProvider === 'gemini' ? '(Active)' : '(Standby)'}
                  </span>
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your key from: https://aistudio.google.com/app/apikey
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenAI API Key
                  <span className="text-green-600 ml-2">
                    {selectedProvider === 'openai' ? '(Active)' : '(Standby)'}
                  </span>
                </label>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your key from: https://platform.openai.com/api-keys
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🔍 Provider Comparison:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><strong>Gemini:</strong> Direct video processing, longer context, cost-effective</div>
                <div><strong>OpenAI GPT-4:</strong> Frame-by-frame analysis, detailed image understanding</div>
              </div>
            </div>

            {selectedProvider === 'openai' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🎯 OpenAI GPT-4 Vision Best Practices:</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Reference Images:</strong> Upload clear, high-resolution SOP images showing correct procedures</li>
                  <li><strong>Video Quality:</strong> Ensure good lighting and stable camera for frame extraction</li>
                  <li><strong>Frame Interval:</strong> Use 1-2 seconds for detailed analysis, 3-5 seconds for overview</li>
                  <li><strong>Multiple SOPs:</strong> Upload different reference images for various process steps</li>
                  <li><strong>Naming:</strong> Give descriptive names to reference images (e.g., "Step1_CorrectToolPosition.jpg")</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Video Upload */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="w-6 h-6" />
              Manufacturing Video
            </h2>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {video ? `📹 ${video.name}` : "Click to upload manufacturing video"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports: MP4, AVI, MOV, WebM (Max: 100MB)
                </p>
              </label>
            </div>
            
            {extractedFrames.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">
                  Extracted Frames ({extractedFrames.length}) 
                  <span className="text-sm text-gray-500 ml-2">
                    • {selectedProvider === 'gemini' ? 'Direct video analysis' : 'Frame-based analysis'}
                  </span>
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {extractedFrames.slice(0, 5).map((frame, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={frame.dataUrl}
                        alt={`Frame ${frame.frameNumber}`}
                        className="w-20 h-16 object-cover rounded border"
                      />
                      <p className="text-xs text-center mt-1">{frame.formattedTime}</p>
                    </div>
                  ))}
                  {extractedFrames.length > 5 && (
                    <div className="w-20 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs flex-shrink-0">
                      +{extractedFrames.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reference Images Upload */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Image className="w-6 h-6" />
              Reference Images (SOPs)
            </h2>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {referenceImages.length > 0 
                    ? `📋 ${referenceImages.length} reference image(s) loaded`
                    : "Click to upload standard operating procedures"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, WebP • Multiple images supported
                </p>
              </label>
            </div>

            {referenceImages.length > 0 && (
              <div className="mt-4 space-y-2">
                {referenceImages.map((img, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-2 rounded">
                    <img src={img.dataUrl} alt={img.name} className="w-12 h-12 object-cover rounded" />
                    <span className="flex-1 text-sm truncate">{img.name}</span>
                    <button
                      onClick={() => removeReferenceImage(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Button */}
        <div className="text-center mb-8">
          <button
            onClick={analyzeVideo}
            disabled={!video || referenceImages.length === 0 || loading || (!geminiApiKey && !openaiApiKey)}
            className={`px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 flex items-center justify-center mx-auto ${
              !video || referenceImages.length === 0 || loading || (!geminiApiKey && !openaiApiKey)
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-3 w-6 h-6" />
                {progress > 0 ? `Analyzing with ${selectedProvider.toUpperCase()}... ${progress}%` : 'Initializing AI...'}
              </>
            ) : (
              <>
                <Brain className="w-6 h-6 mr-3" />
                🚀 Run Real-Time Analysis ({selectedProvider.toUpperCase()})
              </>
            )}
          </button>
          
          {(!geminiApiKey && !openaiApiKey) && (
            <p className="text-red-500 text-sm mt-2">
              ⚠️ Please configure at least one API key in settings to enable real-time analysis
            </p>
          )}
        </div>

        {/* Analysis Report */}
        {analysis && (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🔍 Live Analysis Report
                {analysisStats && (
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Powered by {analysisStats.provider.toUpperCase()}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <MessageSquare className="w-5 h-5" />
                Chat with AI
              </button>
            </div>
            <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto border">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {analysis}
                </pre>
              </div>
            </div>
            
            {/* Analysis Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(analysis)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                📋 Copy Report
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([analysis], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `manufacturing-analysis-${new Date().toISOString().split('T')[0]}.txt`;
                  a.click();
                }}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm"
              >
                💾 Download Report
              </button>
              <button 
                onClick={() => window.print()}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-sm"
              >
                🖨️ Print Report
              </button>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {showChat && analysis && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              💬 Chat with AI Inspector
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                Real-time responses
              </span>
            </h2>
            
            {/* Quick Actions */}
            {getEnhancedQuickActions().length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">💡 Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {getEnhancedQuickActions().map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setChatInput(action)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
              {chatMessages.map((message, index) => (
                <div key={index} className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 border shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block p-3 bg-white border rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">AI is analyzing your question...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about safety issues, quality problems, process improvements..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-2 text-xs text-gray-500 text-center">
              🤖 Powered by {selectedProvider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4'} • Real-time contextual responses
            </div>
          </div>
        )}

        {/* API Usage Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">🚀 Getting Started with Real-Time Analysis:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">For Google Gemini API:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                <li>Create a free API key</li>
                <li>Best for direct video processing</li>
                <li>More cost-effective for long videos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For OpenAI GPT-4 Vision:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                <li>Create an API key (requires credits)</li>
                <li>Excellent for detailed frame analysis</li>
                <li>Superior image understanding</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-400">
            <p className="text-sm text-gray-700">
              <strong>💡 Pro Tip:</strong> Start with Gemini for cost-effective video analysis, 
              then switch to GPT-4 Vision for detailed frame-by-frame inspection of critical sections.
            </p>
          </div>
        </div>

        {/* Hidden Elements */}
        <div style={{ display: 'none' }}>
          <video ref={videoRef} />
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

export default ManufacturingInspector;