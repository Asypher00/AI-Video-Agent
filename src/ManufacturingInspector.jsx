// import React, {useState, useRef, useEffect, useCallback } from "react" ; 
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai" ; 
// import { HumanMessage, AIMessage, SystemMessage, ToolMessage} from "@langchain/core/messages" ; 
// import { tool } from "@langchain/core/tools" ; 
// import { createReactAgent} from "@langchain/langgraph/prebuilt" ; 
// import { z } from "zod" ; 
// import { Brain, Loader2} from "lucide-react" ; 

// const ANALYSIS_REPORT_TEMPLATE =  `
// You are an expert manufacturing process inspector. Your task is to analyze a given manufacturing process based on video frames and reference images.
// You need to identify potential safety hazards, quality control issues, process inefficiencies, and deviations from standard operating procedures (SOPs).

// Your analysis should be detailed, objective, and actionable. Provide specific timestamps for observations where possible.

// Structure your analysis as follows:

// ## Manufacturing Process Analysis Report

// ### Executive Summary
// [Brief overview of key findings and overall assessment.]

// ### 1. Safety Compliance
// - **Observation [Timestamp/Frame]:** [Description of safety observation (e.g., operator not wearing PPE, unguarded machinery).]
//   - **Severity:** [Low/Medium/High/Critical]
//   - **Potential Impact:** [Consequence if not addressed (e.g., injury, regulatory fine).]
//   - **Recommended Action:** [Specific action to improve safety.]

// ### 2. Process Compliance (vs. Reference Images)
// - **Observation [Timestamp/Frame]:** [Description of process deviation (e.g., incorrect tool used, step missed, assembly out of sequence).]
//   - **Deviation Type:** [Sequence error, Tooling error, Material handling, etc.]
//   - **Reference Discrepancy:** [How it differs from the reference image/SOP.]
//   - **Recommended Action:** [Specific action to correct process.]

// ### 3. Quality Control
// - **Observation [Timestamp/Frame]:** [Description of quality issue (e.g., visible defect on part, misaligned component, improper finish).]
//   - **Severity:** [Minor/Moderate/Major/Critical]
//   - **Potential Impact:** [Consequence (e.g., rework, scrap, customer return).]
//   - **Recommended Action:** [Specific action to improve quality.]

// ### 4. Efficiency and Optimization
// - **Observation [Timestamp/Frame]:** [Description of inefficiency (e.g., idle time, unnecessary movement, bottleneck).]
//   - **Area for Improvement:** [Time savings, Material reduction, Ergonomics, etc.]
//   - **Recommended Action:** [Specific action to optimize process.]

// ### 5. Overall Recommendations
// [General recommendations to improve the manufacturing line, based on the analysis.]

// ---
// IMPORTANT: ONLY OUTPUT THE REPORT TEXT. DO NOT INCLUDE ANY INTRODUCTORY OR CONCLUDING REMARKS OUTSIDE OF THE REPORT STRUCTURE.
// `;

// const CHAT_PROMPT_TEMPLATE = ({ previousAnalysis, currentChatHistory }) =>  `
// You are an AI assistant specializing in manufacturing processes. You have just performed a detailed analysis of a manufacturing video, and the report is provided below.
// Your role is to answer follow-up questions from the user based on this analysis. If the user asks for a new analysis, you should suggest they upload new files or initiate a new analysis through the appropriate tool.

// ---
// PREVIOUS MANUFACTURING ANALYSIS REPORT:
// ${previousAnalysis || "No analysis has been performed yet."}
// ---

// CONVERSATION CONTEXT:
// ${currentChatHistory}

// Given the previous analysis and the conversation history, answer the user's question.
// If the question cannot be answered from the provided analysis, state that you do not have enough information and suggest they provide more context or re-run the analysis with different inputs.
// Be concise and helpful.
// `;

// const ManufacturingInspector = () => {
//     const [video, setVideo] = useState(null) ; 
//     const [referenceImages, setReferenceImages] = useState(null) ; 
//     const [analysis, setAnalysis] = useState("") ; 
//     const [loaing, setLoading] = useState(false) ; 
//     const [progress, setProgress] = useState(0) ; 
//     const [extractedFrames, setExtractedFrames] = useState([]) ; 
//     const [apiProvider, setApiProvider] = useState("gemini") ; 
//     const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_API_KEY || "") ; 
//     const [frameInterval, setFrameInterval] = useState(2) ; 
//     const [chatMessages, setChatMessages] = useState([]) ; 
//     const [chatInput, setChatInput] = useState("") ;
//     const [chatLoading, setChatLoading] = useState(false) ;
//     const [showChat, setShowChat] = useState(false) ; 
//     const [agentExecutor, setAgentExecutor] = useState(null) ; 
//     const [agentStatus, setAgentStatus] = useState("Not Initialized") ; 

//     const videoRef = useRef(null) ; 
//     const canvasRef = useRef(null) ; 



// }

// src/ManufacturingInspector.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { Brain, Loader2 } from 'lucide-react';

// Import the new components
import ConfigPanel from './components/ConfigPanel';
import VideoUpload from './components/VideoUpload';
import ReferenceImageUpload from './components/ReferenceImageUpload';
import AnalysisReport from './components/AnalysisReport';
import ChatInterface from './components/ChatInterface';
import HiddenCanvasAndVideo from './components/HiddenCanvasAndVideo';

// --- Constants and Prompts (Keep these here or in a separate constants file) ---

const ANALYSIS_PROMPT_TEMPLATE = `
You are an expert manufacturing process inspector. Your task is to analyze a given manufacturing process based on video frames and reference images.
You need to identify potential safety hazards, quality control issues, process inefficiencies, and deviations from standard operating procedures (SOPs).

Your analysis should be detailed, objective, and actionable. Provide specific timestamps for observations where possible.

Structure your analysis as follows:

## Manufacturing Process Analysis Report

### Executive Summary
[Brief overview of key findings and overall assessment.]

### 1. Safety Compliance
- **Observation [Timestamp/Frame]:** [Description of safety observation (e.g., operator not wearing PPE, unguarded machinery).]
  - **Severity:** [Low/Medium/High/Critical]
  - **Potential Impact:** [Consequence if not addressed (e.g., injury, regulatory fine).]
  - **Recommended Action:** [Specific action to improve safety.]

### 2. Process Compliance (vs. Reference Images)
- **Observation [Timestamp/Frame]:** [Description of process deviation (e.g., incorrect tool used, step missed, assembly out of sequence).]
  - **Deviation Type:** [Sequence error, Tooling error, Material handling, etc.]
  - **Reference Discrepancy:** [How it differs from the reference image/SOP.]
  - **Recommended Action:** [Specific action to correct process.]

### 3. Quality Control
- **Observation [Timestamp/Frame]:** [Description of quality issue (e.g., visible defect on part, misaligned component, improper finish).]
  - **Severity:** [Minor/Moderate/Major/Critical]
  - **Potential Impact:** [Consequence (e.g., rework, scrap, customer return).]
  - **Recommended Action:** [Specific action to improve quality.]

### 4. Efficiency and Optimization
- **Observation [Timestamp/Frame]:** [Description of inefficiency (e.g., idle time, unnecessary movement, bottleneck).]
  - **Area for Improvement:** [Time savings, Material reduction, Ergonomics, etc.]
  - **Recommended Action:** [Specific action to optimize process.]

### 5. Overall Recommendations
[General recommendations to improve the manufacturing line, based on the analysis.]

---
IMPORTANT: ONLY OUTPUT THE REPORT TEXT. DO NOT INCLUDE ANY INTRODUCTORY OR CONCLUDING REMARKS OUTSIDE OF THE REPORT STRUCTURE.
`;

const CHAT_PROMPT_TEMPLATE = ({ previousAnalysis, currentChatHistory }) => `
You are an AI assistant specializing in manufacturing processes. You have just performed a detailed analysis of a manufacturing video, and the report is provided below.
Your role is to answer follow-up questions from the user based on this analysis. If the user asks for a new analysis, you should suggest they upload new files or initiate a new analysis through the appropriate tool.

---
PREVIOUS MANUFACTURING ANALYSIS REPORT:
${previousAnalysis || "No analysis has been performed yet."}
---

CONVERSATION CONTEXT:
${currentChatHistory}

Given the previous analysis and the conversation history, answer the user's question.
If the question cannot be answered from the provided analysis, state that you do not have enough information and suggest they provide more context or re-run the analysis with different inputs.
Be concise and helpful.
`;

// --- ManufacturingInspector Component ---

function ManufacturingInspector() {
  const [video, setVideo] = useState(null);
  const [referenceImages, setReferenceImages] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [apiProvider, setApiProvider] = useState('gemini'); // Fixed to gemini for this example
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_API_KEY || ''); // Get from .env
  const [frameInterval, setFrameInterval] = useState(2); // Seconds per frame
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [agentExecutor, setAgentExecutor] = useState(null);
  const [agentStatus, setAgentStatus] = useState('Not Initialized'); // For agent status display

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Agent Initialization ---
  const initializeAgent = useCallback(async () => {
    if (!apiKey) {
      setAgentStatus('API Key Missing');
      setAgentExecutor(null);
      return;
    }

    try {
      setAgentStatus('Initializing...');

      const llmVision = new ChatGoogleGenerativeAI({
        modelName: "gemini-pro-vision",
        apiKey: apiKey,
        temperature: 0.3,
        maxOutputTokens: 2500, // Max tokens for the analysis report
      });

      const llmChat = new ChatGoogleGenerativeAI({
        modelName: "gemini-pro",
        apiKey: apiKey,
        temperature: 0.7, // Higher temperature for more conversational chat
        maxOutputTokens: 1000,
      });

      // Define the tool for manufacturing analysis
      const analysisTool = tool(
        async ({ videoFrames, referenceImages, frameInterval }) => {
          console.log("Executing manufacturing_analysis_tool...");

          const frameMessages = videoFrames.map(frame => ({
            type: "image_url",
            image_url: frame.dataUrl,
          }));

          const referenceImageMessages = referenceImages.map(img => ({
            type: "image_url",
            image_url: img.dataUrl,
          }));

          const inputMessages = [
            new SystemMessage("You are an expert at analyzing manufacturing processes from video and reference images."),
            new HumanMessage({
              content: [
                { type: "text", text: ANALYSIS_PROMPT_TEMPLATE },
                ...frameMessages,
                { type: "text", text: `\n\nReference Images Provided:` },
                ...referenceImageMessages,
                { type: "text", text: `\n\nAnalyze the video frames against the reference images, focusing on safety, process compliance, quality, and efficiency. Frame interval: ${frameInterval} seconds.` }
              ],
            }),
          ];

          try {
            const result = await llmVision.invoke(inputMessages);
            return result.content;
          } catch (error) {
            console.error("Error during analysis tool invocation:", error);
            return `Error performing analysis: ${error.message}`;
          }
        },
        {
          name: "manufacturing_analysis_tool",
          description: `Performs a detailed manufacturing process analysis based on a series of video frames and reference images. This tool is for initial comprehensive analysis of a new video.
          It requires base64 encoded video frames and reference images, along with the frame interval.`,
          schema: z.object({
            videoFrames: z.array(z.object({
              dataUrl: z.string().describe("Base64 encoded data URL of a video frame (e.g., 'data:image/jpeg;base64,...')"),
              timestamp: z.number().describe("Timestamp of the frame in seconds"),
              frameNumber: z.number().describe("Sequential number of the frame"),
            })).describe("An array of objects, each containing the base64 data URL, timestamp, and frame number for video frames."),
            referenceImages: z.array(z.object({
              dataUrl: z.string().describe("Base64 encoded data URL of a reference image (e.g., 'data:image/jpeg;base64,...')"),
              name: z.string().describe("Original filename of the reference image"),
            })).describe("An array of objects, each containing the base64 data URL and original name for reference images."),
            frameInterval: z.number().describe("The interval in seconds between extracted video frames."),
          }),
        }
      );

      // Define the tool for conversational chat
      const chatTool = tool(
        async ({ currentChatHistory, userQuestion, previousAnalysis }) => {
          console.log("Executing expert_chat_tool...");
          const messages = [
            new SystemMessage(CHAT_PROMPT_TEMPLATE({ previousAnalysis, currentChatHistory })),
            new HumanMessage(userQuestion),
          ];
          try {
            const result = await llmChat.invoke(messages);
            return result.content;
          } catch (error) {
            console.error("Error during chat tool invocation:", error);
            return `Error processing chat message: ${error.message}`;
          }
        },
        {
          name: "expert_chat_tool",
          description: `Engages in a conversational chat about the *existing* manufacturing analysis report. Use this tool for follow-up questions, clarifications, or general inquiries about the analysis.
          Do NOT use this tool if the user explicitly asks for a *new* video analysis.`,
          schema: z.object({
            currentChatHistory: z.string().describe("The full history of the current chat conversation, formatted as 'Role: Message\\n...'"),
            userQuestion: z.string().describe("The user's current question."),
            previousAnalysis: z.string().describe("The full text of the previously generated manufacturing analysis report."),
          }),
        }
      );

      const tools = [analysisTool, chatTool];

      const agent = createReactAgent({
        llm: llmChat, // This LLM is for the agent's reasoning (which tool to call or respond directly)
        tools,
        prompt: ({ messages }) => {
          const currentAnalysisContext = analysis ? `Current Analysis: ${analysis.substring(0, Math.min(analysis.length, 500))}... (full analysis is available for tools)` : "No analysis has been performed yet.";
          return [
            new SystemMessage(`You are a highly intelligent and versatile manufacturing AI agent.
            You can perform two main functions:
            1. Conduct a detailed manufacturing process analysis from video frames and reference images.
            2. Engage in a knowledgeable conversation about an existing manufacturing analysis report.

            Here's how you should behave:
            - If the user explicitly asks to "analyze a video", "perform an inspection", "start a new analysis", or provides new video/image files, you should use the \`manufacturing_analysis_tool\`. Ensure you have all necessary inputs (video frames, reference images, frame interval) before calling this tool.
            - For all other questions, especially follow-up questions about an already generated analysis, clarifications, or general inquiries, you should use the \`expert_chat_tool\`. This tool will leverage the existing analysis report for answers.
            - If you need more information to perform an analysis (e.g., video or images are missing), tell the user what is needed.
            - Always be polite and helpful.

            ${currentAnalysisContext}
            `),
            ...messages,
          ];
        },
      });

      setAgentExecutor(agent);
      setAgentStatus('Ready');
    } catch (error) {
      console.error("Failed to initialize agent:", error);
      setAgentStatus('Error: Check API Key');
      setAgentExecutor(null); // Ensure agentExecutor is null on error
    }
  }, [apiKey, analysis]); // Re-initialize agent if API key or analysis changes

  // Initialize agent on component mount or API key change
  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  // --- Video and Image Handling ---

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please upload a video file.');
        setVideo(null);
        return;
      }
      setVideo(file);
      setExtractedFrames([]); // Clear previous frames
      setAnalysis(''); // Clear previous analysis
      setShowChat(false); // Hide chat
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file: file,
      dataUrl: URL.createObjectURL(file), // For preview
      name: file.name,
    }));
    setReferenceImages(prev => [...prev, ...newImages]);
    setAnalysis(''); // Clear previous analysis
    setShowChat(false); // Hide chat
  };

  const removeReferenceImage = (indexToRemove) => {
    setReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const extractFramesFromVideo = async (videoFile) => {
    const frames = [];
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    if (!videoElement || !canvasElement || !videoFile) {
      console.error("Video element, canvas element, or video file is missing.");
      return [];
    }

    // Ensure video src is updated
    videoElement.src = URL.createObjectURL(videoFile);

    // Wait for video metadata to load
    await new Promise(resolve => {
      videoElement.onloadedmetadata = () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        resolve();
      };
    });

    const duration = videoElement.duration;
    // Cap at 20 frames to avoid excessive API calls
    const totalFramesToExtract = Math.min(Math.floor(duration / frameInterval), 20);

    for (let i = 0; i < totalFramesToExtract; i++) {
      const time = i * frameInterval;
      videoElement.currentTime = time;

      // Wait for seeked event for accurate frame capture
      await new Promise(resolve => {
        const onSeeked = () => {
          ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          const dataUrl = canvasElement.toDataURL('image/jpeg', 0.8);
          frames.push({ dataUrl, timestamp: time, frameNumber: i + 1 });
          setProgress(Math.floor(((i + 1) / totalFramesToExtract) * 100)); // Update progress here
          videoElement.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });
    }
    return frames;
  };

  // --- Analysis Logic ---

  const analyzeVideo = async () => {
    if (!video || referenceImages.length === 0 || !apiKey) {
      alert('Please upload a video, at least one reference image, and provide your API key.');
      return;
    }

    setLoading(true);
    setAnalysis('');
    setProgress(0);
    setExtractedFrames([]);
    setChatMessages([]); // Clear chat for new analysis
    setShowChat(false);

    try {
      if (!agentExecutor) {
        setAgentStatus('Agent not initialized. Please check API Key and try again.');
        setLoading(false);
        return;
      }

      setAgentStatus('Extracting frames...');
      const frames = await extractFramesFromVideo(video);
      setExtractedFrames(frames);
      setProgress(0); // Reset progress for analysis step (AI processing)

      if (frames.length === 0) {
        alert("No frames could be extracted from the video. Please try a different video or adjust frame interval.");
        setLoading(false);
        return;
      }

      setAgentStatus('Performing analysis with Gemini Pro Vision...');
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Starting manufacturing process analysis...', timestamp: Date.now() }]);

      // Construct a HumanMessage that directly asks the agent to use the analysis tool
      const initialMessage = new HumanMessage({
        content: "Please perform a comprehensive manufacturing process analysis.",
        tool_calls: [{
          name: "manufacturing_analysis_tool",
          args: {
            videoFrames: frames,
            referenceImages: referenceImages.map(img => ({ dataUrl: img.dataUrl, name: img.name })),
            frameInterval: frameInterval
          }
        }]
      });

      let fullResponse = '';
      const stream = agentExecutor.stream({ messages: [initialMessage] });

      for await (const state of stream) {
        console.log("Agent Stream State:", state);
        if (state.messages) {
          const latestMessage = state.messages[state.messages.length - 1];
          // Check if it's a ToolMessage with actual tool output (content)
          if (latestMessage instanceof ToolMessage && latestMessage.tool_call_id && latestMessage.content) {
            fullResponse = latestMessage.content;
            setAnalysis(latestMessage.content);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Analysis complete. Report generated. You can now ask questions about it.`, timestamp: Date.now() }]);
            setShowChat(true); // Show chat after analysis
            setAgentStatus('Analysis Complete');
            setProgress(100); // Analysis finished
            break; // Stop streaming once the main analysis output is received
          } else if (latestMessage instanceof AIMessage) {
            // Agent thinking messages or direct responses (less likely for explicit tool call)
            console.log("Agent thinking:", latestMessage.content);
            setAgentStatus(`AI Thinking: ${latestMessage.content.substring(0, 50)}...`);
          }
        }
        setProgress(prev => Math.min(99, prev + 1)); // Increment progress while waiting
      }

      if (!fullResponse) {
          setAnalysis("Analysis could not be generated. The agent might not have called the tool correctly or an error occurred during tool execution. Check console for details.");
          setChatMessages(prev => [...prev, { role: 'assistant', content: "Analysis failed to generate. Please check the console for errors.", timestamp: Date.now() }]);
      }

    } catch (error) {
      console.error("Error during video analysis:", error);
      setAnalysis(`Error: ${error.message}. Please check your API key and try again.`);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error during analysis: ${error.message}`, timestamp: Date.now() }]);
      setAgentStatus('Analysis Error');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // --- Chat Logic ---

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !agentExecutor) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setChatLoading(true);

    try {
      setAgentStatus('Thinking...');

      // Prepare messages for the agent, including the analysis report as context for its tools
      const currentChatHistoryFormatted = chatMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const messagesForAgent = [
        new SystemMessage(`The current manufacturing analysis report is: \n\n${analysis || "No prior analysis."}`),
        new HumanMessage(userMessage) // The new user question
      ];

      // We explicitly call the chat tool for chat messages, as the agent's prompt
      // guides it to use this tool for follow-up questions.
      const stream = agentExecutor.stream({
        messages: [
          new HumanMessage({
            content: userMessage,
            tool_calls: [{
              name: "expert_chat_tool",
              args: {
                currentChatHistory: currentChatHistoryFormatted,
                userQuestion: userMessage,
                previousAnalysis: analysis
              }
            }]
          })
        ]
      });

      let fullResponseContent = '';
      for await (const state of stream) {
        console.log("Chat Agent Stream State:", state);
        if (state.messages) {
          const latestMessage = state.messages[state.messages.length - 1];
          if (latestMessage instanceof ToolMessage && latestMessage.tool_call_id) {
            // This means the chat tool executed and returned its content
            fullResponseContent = latestMessage.content;
            setChatMessages(prev => [...prev, { role: 'assistant', content: fullResponseContent, timestamp: Date.now() }]);
            setAgentStatus('Ready');
            break; // Stop streaming once the tool output is received
          } else if (latestMessage instanceof AIMessage) {
            // Agent's direct response (e.g., thinking steps, or if it decides not to use tool)
            console.log("Agent direct response in chat stream:", latestMessage.content);
            setAgentStatus(`AI Responding: ${latestMessage.content.substring(0,50)}...`);
          }
        }
      }

      if (!fullResponseContent) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: "I couldn't generate a response. The agent might not have called the chat tool correctly or an error occurred.", timestamp: Date.now() }]);
      }


    } catch (error) {
      console.error("Error sending chat message:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}`, timestamp: Date.now() }]);
      setAgentStatus('Chat Error');
    } finally {
      setChatLoading(false);
    }
  };

  const startNewChat = () => {
    setChatMessages([]);
    setShowChat(true);
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Hello! I am your Manufacturing Inspector AI. How can I help you with the analysis report?', timestamp: Date.now() }]);
    if (analysis) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `The current analysis report has ${analysis.length > 500 ? 'a lot of content.' : 'some content.'} Feel free to ask specific questions about it.`, timestamp: Date.now() }]);
    }
  };

  const getQuickActions = useCallback(() => {
    const actions = [];
    if (analysis.toLowerCase().includes('safety')) {
      actions.push("What are the main safety concerns?");
    }
    if (analysis.toLowerCase().includes('quality')) {
      actions.push("Summarize the quality issues.");
    }
    if (analysis.toLowerCase().includes('efficiency')) {
      actions.push("How can we improve efficiency?");
    }
    if (analysis.toLowerCase().includes('deviation')) {
      actions.push("List process deviations.");
    }
    // Add general questions if no specific keywords found, but analysis exists
    if (actions.length === 0 && analysis) {
        actions.push("Give me a brief summary of the analysis.");
        actions.push("What are the key recommendations?");
    }
    return actions.slice(0, 3); // Limit to 3 quick actions
  }, [analysis]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 space-y-8">
        <header className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="flex items-center gap-3 text-emerald-600">
            <Brain className="w-12 h-12" />
            <h1 className="text-4xl font-extrabold tracking-tight">
              AI Manufacturing Inspector
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl">
            Analyze manufacturing processes using multi-modal AI. Upload video, reference images, and get detailed reports and interactive chat.
          </p>
        </header>

        <ConfigPanel
          apiKey={apiKey}
          setApiKey={setApiKey}
          apiProvider={apiProvider}
          setApiProvider={setApiProvider}
          frameInterval={frameInterval}
          setFrameInterval={setFrameInterval}
          agentStatus={agentStatus}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <VideoUpload
            video={video}
            handleVideoUpload={handleVideoUpload}
            extractedFrames={extractedFrames}
          />
          <ReferenceImageUpload
            referenceImages={referenceImages}
            handleImageUpload={handleImageUpload}
            removeReferenceImage={removeReferenceImage}
          />
        </div>

        <section className="text-center mt-8">
          <button
            onClick={analyzeVideo}
            disabled={!video || referenceImages.length === 0 || loading || !apiKey || agentStatus.includes('Error') || agentStatus !== 'Ready'}
            className={`px-8 py-4 rounded-full text-xl font-bold transition duration-300 ease-in-out flex items-center justify-center mx-auto ${
              !video || referenceImages.length === 0 || loading || !apiKey || agentStatus.includes('Error') || agentStatus !== 'Ready'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-3 w-6 h-6" />
                {progress > 0 ? `Analyzing... ${progress}%` : 'Preparing Analysis...'}
              </>
            ) : (
              <>
                <Brain className="w-6 h-6 mr-3" />
                Run Manufacturing Analysis
              </>
            )}
          </button>
          {!apiKey && <p className="text-red-500 text-sm mt-2">Please provide your Google Gemini API Key to run the analysis.</p>}
          {(video && referenceImages.length === 0) && <p className="text-red-500 text-sm mt-2">Please upload at least one reference image.</p>}
          {(apiKey && agentStatus.includes('Error')) && <p className="text-red-500 text-sm mt-2">Agent initialization error. Check console and API key.</p>}
        </section>

        {analysis && (
          <AnalysisReport
            analysis={analysis}
            startNewChat={startNewChat}
          />
        )}

        {showChat && (
          <ChatInterface
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
            chatLoading={chatLoading}
            getQuickActions={getQuickActions}
          />
        )}

        <HiddenCanvasAndVideo videoRef={videoRef} canvasRef={canvasRef} />
      </div>
    </div>
  );
}

export default ManufacturingInspector;
