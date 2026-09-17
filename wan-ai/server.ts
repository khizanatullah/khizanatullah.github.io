import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

const execAsync = promisify(exec);
const fsPromises = fs.promises;

// Ensure workspace and memory directories exist
const WORKSPACE_DIR = path.join(process.cwd(), "workspace");
const MEMORY_FILE = path.join(process.cwd(), "memory.json");
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({ facts: [], preferences: {} }, null, 2));
}

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // List all files in workspace
  app.get("/api/workspace/files", async (req, res) => {
    try {
      const fileNames = await fsPromises.readdir(WORKSPACE_DIR);
      const fileList = await Promise.all(
        fileNames.map(async (name) => {
          const stats = await fsPromises.stat(path.join(WORKSPACE_DIR, name));
          return {
            name,
            size: stats.size,
            updatedAt: stats.mtime
          };
        })
      );
      res.json({ files: fileList });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Download a file from workspace
  app.get("/api/workspace/files/:filename", async (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(WORKSPACE_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }
      res.download(filePath, filename);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a file from workspace
  app.delete("/api/workspace/files/:filename", async (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(WORKSPACE_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { command, history, provider, model, customApiKey, systemInstruction, imageAttachment } = req.body;

      let responseText = "";
      let activeModel = null;

      if (provider === 'gemini' || !provider) {
        const cleanCustomKey = typeof customApiKey === 'string' ? customApiKey.trim().replace(/^["']|["']$/g, '') : '';
        const apiKey = cleanCustomKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(400).json({ error: "[API Key Missing] Silakan masukkan Gemini API Key Anda di menu Pengaturan (ikon Gear) untuk mulai mengobrol." });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const userParts: any[] = [{ text: command }];
        if (imageAttachment && imageAttachment.data && imageAttachment.mimeType) {
          userParts.push({
            inlineData: {
              data: imageAttachment.data,
              mimeType: imageAttachment.mimeType
            }
          });
        }

        const requestParams: any = {
          contents: [
            ...history.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            })),
            { role: "user", parts: userParts }
          ],
          config: {
            systemInstruction: systemInstruction || "You are a helpful AI assistant.",
            temperature: 0.7,
            safetySettings: [{category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE"}, {category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE"}, {category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE"}, {category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE"}],
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "search_web",
                    description: "Search the web for real-time information, latest news, articles, facts, prices, weather, sports scores, or any internet topic. Use this proactively whenever the user asks for fresh or external information.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        query: { type: "STRING", description: "The keywords or search query to look up on the web" }
                      },
                      required: ["query"]
                    }
                  },
                  {
                    name: "fetch_web_page",
                    description: "Fetch and read the text content of any URL/webpage directly. Use this when the user shares a link, or after a search to read full documentation, articles, or papers.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        url: { type: "STRING", description: "The complete http or https URL of the page to read" }
                      },
                      required: ["url"]
                    }
                  },
                  {
                    name: "execute_python_code",
                    description: "Hermes Scratchpad: Execute Python 3 code in an isolated environment. Use this for complex calculations, data analysis, statistics, string formatting, algorithms, or testing code snippets to guarantee accurate mathematical and logical answers.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        code: { type: "STRING", description: "The Python 3 script to execute (use print(...) to display the result)" }
                      },
                      required: ["code"]
                    }
                  },
                  {
                    name: "write_workspace_file",
                    description: "Create or write content to a file in the workspace directory. Use this when the user asks to save notes, write code files, save research reports, or store data.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        filename: { type: "STRING", description: "The name of the file (e.g., notes.txt, report.md, script.py)" },
                        content: { type: "STRING", description: "The full text content to write into the file" }
                      },
                      required: ["filename", "content"]
                    }
                  },
                  {
                    name: "read_workspace_file",
                    description: "Read the content of a file from the workspace directory or list all files if filename is 'LIST'.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        filename: { type: "STRING", description: "The name of the file to read, or 'LIST' to list all saved workspace files" }
                      },
                      required: ["filename"]
                    }
                  },
                  {
                    name: "manage_memory",
                    description: "Long-term memory management. Store important facts about the user (e.g. name, preferences, ongoing projects) or retrieve all stored memories. Action can be 'SAVE' or 'GET'.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        action: { type: "STRING", description: "'SAVE' to record a fact or preference, or 'GET' to retrieve all saved memories" },
                        fact: { type: "STRING", description: "The fact to remember (required if action is 'SAVE')" }
                      },
                      required: ["action"]
                    }
                  },
                  {
                    name: "get_current_time",
                    description: "Get current exact date, time, and timezone information. Use whenever the user asks for current time, day, date, or relative scheduling.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        timezone: { type: "STRING", description: "Optional timezone string like 'Asia/Jakarta' or 'UTC'. Default is 'Asia/Jakarta' (WIB)." }
                      }
                    }
                  },
                  {
                    name: "run_shell_command",
                    description: "Execute bash terminal commands ONLY when the user explicitly requests a technical server operation, managing files on disk, checking server specs (RAM/CPU/disk), or deploying. NEVER call this tool for regular chats, greetings, personal talk, general knowledge, roleplay, or casual conversations.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        command: { type: "STRING", description: "The bash command to execute" }
                      },
                      required: ["command"]
                    }
                  }
                ]
              }
            ]
          }
        };

        const targetModel = model || "gemini-pro-latest";
        // Intelligent fallback priority: chosen model -> high-availability flash-lite -> flash tiers -> pro tiers
        const candidates = [
          targetModel,
          "gemini-flash-lite-latest",
          "gemini-3.8-flash",
          "gemini-3.7-flash",
          "gemini-3.5-flash",
          "gemini-flash-latest",
          "gemini-pro-latest"
        ];
        // Ensure no duplicates, preserve priority, and strictly remove deprecated 404 models like gemini-1.5-flash
        const uniqueModels = Array.from(new Set(candidates)).filter(m => m !== "gemini-1.5-flash");
        
        let response;
        let lastError;
        let primaryError = null;
        activeModel = targetModel;

        for (const currentModel of uniqueModels) {
           console.log(`[DEBUG] Trying model: ${currentModel}`);
           try {
              response = await ai.models.generateContent({
                  model: currentModel,
                  ...requestParams
              });
              activeModel = currentModel;
              console.log(`[DEBUG] Success with model: ${currentModel}`);
              break; // Success, break out of retry loop
           } catch (err: any) {
              lastError = err;
              const errMsg = err.message || "";
              const statusStr = String(err.status || "");
              
              const isQuotaOrBusy = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("overload") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || statusStr.includes("429") || statusStr.includes("503");
              const isNotFound = errMsg.includes("404") || errMsg.includes("not found") || errMsg.includes("is not found");
              const isUnauth = errMsg.includes("401") || errMsg.includes("UNAUTHENTICATED") || statusStr.includes("401");
              
              if (!primaryError && (isQuotaOrBusy || isUnauth)) {
                  primaryError = err; // Save the root reason it failed initially
              }

              if (isQuotaOrBusy || isNotFound) {
                  console.warn(`[Fallback] Model ${currentModel} is busy, not found, or quota limited. Cascading to next...`);
                  continue;
              } else if (isUnauth) {
                  const isCustomKey = !!cleanCustomKey;
                  if (isCustomKey) {
                      throw new Error("[Invalid Key] Gemini API Key Anda tidak valid atau kadaluarsa. Pastikan kunci yang dimasukkan di menu Pengaturan sudah benar.");
                  } else {
                      throw new Error("[System Key Invalid] Kunci default sistem sedang tidak aktif. Silakan masukkan Gemini API Key Anda sendiri di menu Pengaturan (ikon Gear) untuk menggunakan aplikasi.");
                  }
              } else {
                  console.error(`[DEBUG] Unhandled error for ${currentModel}:`, errMsg);
                  throw err; 
              }
           }
        }

        if (!response) {
            const errorToThrow = primaryError || lastError;
            const isCustomKey = !!cleanCustomKey;
            const keySource = isCustomKey ? "API Key Anda" : "Kunci server default";
            if (errorToThrow?.message?.includes("429") || errorToThrow?.message?.includes("RESOURCE_EXHAUSTED")) {
                throw new Error(`[Quota Exceeded] Kuota ${keySource} telah habis (Limit tercapai) untuk SEMUA model. Silakan buat API Key baru di Google AI Studio atau tunggu hingga besok.`);
            } else if (errorToThrow?.message?.includes("503") || errorToThrow?.message?.includes("UNAVAILABLE")) {
                throw new Error(`[Server Busy] Server Google sedang mengalami lonjakan trafik tinggi (503). Silakan coba kirim ulang beberapa saat lagi.`);
            }
            throw new Error(`Gagal memproses AI: ${errorToThrow?.message || "Semua model cadangan sedang sibuk"}`);
        }

        // Handle function calling loop (Agentic ReAct Loop)
        let maxLoops = 5;
        while (response.functionCalls && response.functionCalls.length > 0 && maxLoops > 0) {
            maxLoops--;
            const calls = response.functionCalls;
            const functionResponses = [];
            
            for (const call of calls) {
                if (call.name === "search_web") {
                    const query = (call.args as any).query;
                    console.log(`[Violet AI Search Tool] Searching query: ${query}`);
                    let resultOutput = "";
                    try {
                        const safeQuery = query.replace(/"/g, '\\"');
                        const { stdout, stderr } = await execAsync(`node search-api.cjs "${safeQuery}"`);
                        resultOutput = stdout || stderr || "No results returned.";
                    } catch (e: any) {
                        resultOutput = `Search error: ${e.message}`;
                    }
                    console.log(`[Violet AI Search Tool] Results fetched: ${resultOutput.substring(0, 120)}...`);
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "fetch_web_page") {
                    const targetUrl = (call.args as any).url;
                    console.log(`[Violet AI Web Fetcher] Reading: ${targetUrl}`);
                    let resultOutput = "";
                    try {
                        // Use curl or python to fetch text cleanly
                        const { stdout, stderr } = await execAsync(`python3 -c "import urllib.request, re; req = urllib.request.Request('${targetUrl}', headers={'User-Agent': 'Mozilla/5.0'}); html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore'); clean = re.sub(r'<script[\\s\\S]*?</script>|<style[\\s\\S]*?</style>|<[^>]+>', ' ', html); print(' '.join(clean.split())[:20000])"`);
                        resultOutput = stdout || stderr || "No content extracted.";
                    } catch (e: any) {
                        resultOutput = `Fetch error: ${e.message}`;
                    }
                    console.log(`[Violet AI Web Fetcher] Result length: ${resultOutput.length}`);
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "execute_python_code") {
                    const code = (call.args as any).code;
                    console.log(`[Violet AI Python Scratchpad] Executing Python code`);
                    let resultOutput = "";
                    try {
                        const tempFile = path.join(WORKSPACE_DIR, `temp_${Date.now()}.py`);
                        await fsPromises.writeFile(tempFile, code, "utf-8");
                        const { stdout, stderr } = await execAsync(`python3 "${tempFile}"`);
                        await fsPromises.unlink(tempFile).catch(() => {});
                        resultOutput = stdout || (stderr ? `Standard Error: ${stderr}` : "Code executed successfully with no output.");
                    } catch (e: any) {
                        resultOutput = `Execution error: ${e.message}\n${e.stderr || ""}`;
                    }
                    console.log(`[Violet AI Python] Output: ${resultOutput.substring(0, 120)}...`);
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "write_workspace_file") {
                    const filename = path.basename((call.args as any).filename || "notes.txt");
                    const content = (call.args as any).content || "";
                    console.log(`[Violet AI Workspace] Writing file: ${filename}`);
                    let resultOutput = "";
                    try {
                        const targetPath = path.join(WORKSPACE_DIR, filename);
                        await fsPromises.writeFile(targetPath, content, "utf-8");
                        resultOutput = `File '${filename}' successfully saved to workspace (${content.length} characters).`;
                    } catch (e: any) {
                        resultOutput = `Write error: ${e.message}`;
                    }
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "read_workspace_file") {
                    const filename = (call.args as any).filename || "LIST";
                    console.log(`[Violet AI Workspace] Reading file/list: ${filename}`);
                    let resultOutput = "";
                    try {
                        if (filename.toUpperCase() === "LIST") {
                            const files = await fsPromises.readdir(WORKSPACE_DIR);
                            resultOutput = files.length > 0 ? `Files in workspace: ${files.join(", ")}` : "Workspace is currently empty.";
                        } else {
                            const safeFilename = path.basename(filename);
                            const targetPath = path.join(WORKSPACE_DIR, safeFilename);
                            if (fs.existsSync(targetPath)) {
                                resultOutput = await fsPromises.readFile(targetPath, "utf-8");
                            } else {
                                resultOutput = `File '${safeFilename}' not found in workspace.`;
                            }
                        }
                    } catch (e: any) {
                        resultOutput = `Read error: ${e.message}`;
                    }
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "manage_memory") {
                    const action = ((call.args as any).action || "GET").toUpperCase();
                    const fact = (call.args as any).fact;
                    console.log(`[Violet AI Long-Term Memory] Action: ${action}`);
                    let resultOutput = "";
                    try {
                        let memoryData = { facts: [] as string[], preferences: {} };
                        if (fs.existsSync(MEMORY_FILE)) {
                            const raw = await fsPromises.readFile(MEMORY_FILE, "utf-8");
                            memoryData = JSON.parse(raw);
                        }
                        if (action === "SAVE" && fact) {
                            if (!memoryData.facts.includes(fact)) {
                                memoryData.facts.push(fact);
                                await fsPromises.writeFile(MEMORY_FILE, JSON.stringify(memoryData, null, 2));
                            }
                            resultOutput = `Memory updated! Learned: "${fact}"`;
                        } else {
                            resultOutput = memoryData.facts.length > 0 
                                ? `Known memories:\n- ${memoryData.facts.join("\n- ")}`
                                : "No memories saved yet.";
                        }
                    } catch (e: any) {
                        resultOutput = `Memory error: ${e.message}`;
                    }
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "get_current_time") {
                    const tz = (call.args as any).timezone || "Asia/Jakarta";
                    const now = new Date();
                    const formatted = now.toLocaleString("id-ID", { timeZone: tz, dateStyle: "full", timeStyle: "long" });
                    const resultOutput = `Current Date & Time in ${tz}: ${formatted} (ISO: ${now.toISOString()})`;
                    console.log(`[Violet AI Time] ${resultOutput}`);
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                } else if (call.name === "run_shell_command") {
                    const cmd = (call.args as any).command;
                    console.log(`[Violet AI Tool] Executing command: ${cmd}`);
                    let resultOutput = "";
                    try {
                        const { stdout, stderr } = await execAsync(cmd);
                        resultOutput = stdout || stderr || "Command executed successfully with no output.";
                    } catch (e: any) {
                        resultOutput = `Error: ${e.message}\n${e.stderr || ""}`;
                    }
                    console.log(`[Violet AI Tool] Result: ${resultOutput.substring(0, 100)}...`);
                    functionResponses.push({
                        name: call.name,
                        response: { result: resultOutput }
                    });
                }
            }

            // Append the model's exact response content to history to preserve thought_signature
            requestParams.contents.push(response.candidates[0].content);
            requestParams.contents.push({ role: 'user', parts: functionResponses.map(fr => ({ functionResponse: fr })) });

            response = await ai.models.generateContent({
                model: activeModel,
                ...requestParams
            });
        }

        let extractedText = "";
        if (response && response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0]?.content?.parts || [];
            const textParts = parts.filter((p: any) => p.text);
            if (textParts.length > 0) {
                 extractedText = textParts.map((p: any) => p.text).join("\n");
            }
        }
        
        responseText = extractedText || (response && response.text) || "";
      } else {
         return res.status(400).json({ error: "Unsupported provider. Only Gemini is supported." });
      }

      res.json({ text: responseText, activeModel });
    } catch (error: any) {
      console.error("AI API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response." });
    }
  });

  app.post("/api/test-connection", async (req, res) => {
    try {
      const { model, apiKey: customApiKey } = req.body;
      const cleanCustomKey = typeof customApiKey === 'string' ? customApiKey.trim().replace(/^["']|["']$/g, '') : '';
      const apiKeyToUse = cleanCustomKey || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        return res.status(400).json({ success: false, error: "API Key belum dimasukkan. Silakan isi di kolom API Key." });
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const targetModel = model || "gemini-pro-latest";
      const candidates = [
        targetModel,
        "gemini-flash-lite-latest",
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-pro-latest"
      ];
      const uniqueModels = Array.from(new Set(candidates)).filter(m => m !== "gemini-1.5-flash");
      
      let activeModel = null;
      let success = false;
      let lastErrorMsg = "";

      for (const currentModel of uniqueModels) {
         try {
            await ai.models.generateContent({
                model: currentModel,
                contents: "Ping"
            });
            activeModel = currentModel;
            success = true;
            break;
         } catch (err: any) {
            lastErrorMsg = err.message || "Unknown error";
            const errMsg = lastErrorMsg;
            const isUnauth = errMsg.includes("401") || errMsg.includes("UNAUTHENTICATED") || String(err.status || "").includes("401");
            if (isUnauth) {
                return res.status(401).json({ success: false, error: "API Key tidak valid atau kadaluarsa." });
            }
         }
      }

      if (success) {
          res.json({ success: true, activeModel });
      } else {
          res.status(500).json({ success: false, error: `Semua model cadangan gagal. Info: ${lastErrorMsg}` });
      }
    } catch (error: any) {
      console.error("Test Connection Error:", error);
      res.status(500).json({ success: false, error: error.message || "Gagal menguji koneksi." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
