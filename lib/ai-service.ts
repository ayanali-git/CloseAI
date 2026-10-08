import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true
});

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function withUserContext(base: string, userContext?: string) {
  const extra = userContext?.trim();
  if (!extra) return base;
  return `${base}\n\nUser profile and preferences:\n${extra}`;
}

export class AIService {
  private useGemini = true; // Set to true to prefer Gemini by default
  private static openAiQuotaExceededUntil = Date.now() + 60 * 60 * 1000; // Cache known quota limit

  private getGenAIClient() {
    const key = process.env.GOOGLE_API_KEY;
    if (key && key !== 'dummy-key') {
      return new GoogleGenerativeAI(key);
    }
    return null;
  }

  private getOpenAIClient() {
    const key = process.env.OPENAI_API_KEY;
    if (key && key !== 'dummy-key') {
      return new OpenAI({ apiKey: key });
    }
    return null;
  }

  async generateResponse(
    messages: Message[],
    fileContext?: string,
    imageUrls?: string[],
    modelName: string = "Gemini 3.8 flash",
    think: boolean = false,
    userContext?: string
  ): Promise<AIResponse> {
    const isGemini = modelName.toLowerCase().includes('gemini');

    if (isGemini) {
      return await this.generateGeminiResponse(messages, fileContext, imageUrls, modelName, think, userContext);
    } else {
      return await this.generateOpenAIResponse(messages, fileContext, imageUrls, modelName, think, userContext);
    }
  }

  async generateOpenAIResponse(
    messages: Message[],
    fileContext?: string,
    imageUrls?: string[],
    modelName: string = "GPT-5.4",
    think: boolean = false,
    userContext?: string
  ): Promise<AIResponse> {
    if (Date.now() < AIService.openAiQuotaExceededUntil) {
      const genAI = this.getGenAIClient();
      if (genAI) {
        return await this.generateGeminiResponse(messages, fileContext, imageUrls, "gemini-3.8-flash", think, userContext);
      }
    }

    const openaiClient = this.getOpenAIClient();
    if (!openaiClient) {
      // If OpenAI key is missing but Gemini is configured, use Gemini with fallback
      const genAI = this.getGenAIClient();
      if (genAI) {
        return await this.generateGeminiResponse(messages, fileContext, imageUrls, "gemini-3.8-flash", think, userContext);
      }
      throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY in your .env file.');
    }

    let openAiModel = 'gpt-4o';
    const lower = modelName.toLowerCase();
    if (lower.includes('mini')) {
      openAiModel = 'gpt-4o-mini';
    } else if (lower.includes('3.5')) {
      openAiModel = 'gpt-3.5-turbo';
    } else if (lower.includes('4o')) {
      openAiModel = 'gpt-4o';
    } else {
      openAiModel = 'gpt-4o';
    }

    try {
      const systemPrompt = withUserContext(
        think
          ? `You are CloseAI in Deep Thinking & Reasoning mode. Analyze every aspect of the question thoroughly. Reason step-by-step, explore nuances and edge cases, and provide comprehensive, in-depth, and well-structured answers with complete details and explanations.${fileContext ? `\n\nFile Context:\n${fileContext}` : ''}`
          : `You are CloseAI, a quick and helpful assistant. Provide direct, concise, clear, and accurate answers without unnecessary verbosity.${fileContext ? `\n\nFile Context:\n${fileContext}` : ''}`,
        userContext
      );

      const fullMessages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      for (let i = 0; i < messages.length - 1; i++) {
        fullMessages.push({
          role: messages[i].role,
          content: messages[i].content
        });
      }

      const lastMessage = messages[messages.length - 1];
      if (imageUrls && imageUrls.length > 0 && (openAiModel.startsWith('gpt-4') || openAiModel.startsWith('gpt-5'))) {
        const contentParts: any[] = [{ type: 'text', text: lastMessage.content }];
        for (const url of imageUrls) {
          contentParts.push({
            type: 'image_url',
            image_url: { url }
          });
        }
        fullMessages.push({
          role: lastMessage.role,
          content: contentParts
        });
      } else {
        fullMessages.push({
          role: lastMessage.role,
          content: lastMessage.content
        });
      }

      const response = await openaiClient.chat.completions.create({
        model: openAiModel,
        messages: fullMessages,
        max_tokens: think ? 10000 : 4000,
        temperature: think ? 0.7 : 0.5,
      });

      const content = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      return {
        content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error: any) {
      if (error.code === 'invalid_api_key' || error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please verify your OPENAI_API_KEY in .env.');
      } else if (error.code === 'insufficient_quota' || error.status === 429 || error?.message?.includes('credits') || error?.message?.includes('quota')) {
        AIService.openAiQuotaExceededUntil = Date.now() + 60 * 60 * 1000;
        const genAI = this.getGenAIClient();
        if (genAI) {
          console.warn('OpenAI quota exceeded, falling back to Google Gemini...');
          const fallbackRes = await this.generateGeminiResponse(messages, fileContext, imageUrls, "gemini-3.8-flash", think, userContext);
          return {
            ...fallbackRes,
          };
        }
        throw new Error('OpenAI quota exceeded (no remaining credits on account). Please check your OpenAI billing or switch to Google Gemini.');
      }
      throw new Error(`OpenAI Error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async generateGeminiResponse(
    messages: Message[],
    fileContext?: string,
    imageUrls?: string[],
    modelName: string = "gemini-3.8-flash",
    think: boolean = false,
    userContext?: string
  ): Promise<AIResponse> {
    const genAI = this.getGenAIClient();
    if (!genAI) {
      const openaiClient = this.getOpenAIClient();
      if (openaiClient) {
        return await this.generateOpenAIResponse(messages, fileContext, imageUrls, "GPT-5.4", think, userContext);
      }
      throw new Error('Google Generative AI not initialized (Missing GOOGLE_API_KEY)');
    }

    // Normalize model name and prioritize active gemini-3.6-flash (recommended by Google API)
    const rawModel = (modelName || "gemini-3.6-flash").trim().replace(/\s+/g, "-");
    const activeModel = (rawModel === "gemini-3.8-flash" || rawModel === "gemini-3.8")
      ? "gemini-3.6-flash"
      : rawModel;

    const candidates = [
      activeModel,
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
    ];
    const modelChain = Array.from(new Set(candidates.filter(Boolean)));

    let lastError: any = null;

    for (const candidate of modelChain) {
      try {
        const model = genAI.getGenerativeModel({ model: candidate });

        const systemPrompt = withUserContext(
          think
            ? `You are CloseAI in Deep Thinking & Reasoning mode. Analyze every aspect of the question thoroughly. Reason step-by-step, explore nuances and edge cases, and provide comprehensive, in-depth, and well-structured answers with complete details and explanations. Format your output in clean, elegant Markdown with standard GitHub-Flavored tables and fenced code blocks.${fileContext ? `\n\nFile Context:\n${fileContext}` : ''}`
            : `You are CloseAI, a quick and helpful assistant. Provide direct, concise, clear, and accurate answers without unnecessary verbosity. Format your output in clean, elegant Markdown with standard GitHub-Flavored tables and fenced code blocks.${fileContext ? `\n\nFile Context:\n${fileContext}` : ''}`,
          userContext
        );

        const lastMessage = messages[messages.length - 1];

        // Sanitize conversation history for Gemini:
        // 1. First message must have role 'user'
        // 2. Roles must strictly alternate: user -> model -> user -> model
        // 3. History must end with 'model' (since sendMessage will be the next 'user' turn)
        const rawHistory = messages.slice(0, -1).map(msg => {
          let role = 'user';
          if (msg.role === 'assistant') role = 'model';
          return {
            role: role,
            parts: [{ text: msg.content || '' }]
          };
        }).filter(msg => (msg.role === 'user' || msg.role === 'model') && msg.parts[0].text?.trim());

        const sanitizedHistory: any[] = [];
        for (const item of rawHistory) {
          if (sanitizedHistory.length === 0) {
            if (item.role === 'user') {
              sanitizedHistory.push(item);
            }
          } else {
            const prevRole = sanitizedHistory[sanitizedHistory.length - 1].role;
            if (item.role !== prevRole) {
              sanitizedHistory.push(item);
            }
          }
        }
        // If sanitizedHistory ends with 'user', pop it so sendMessage provides the user turn
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
          sanitizedHistory.pop();
        }

        const messageParts: any[] = [];
        const promptWithContext = `${systemPrompt}\n\nUser: ${lastMessage.content}`;
        messageParts.push({ text: promptWithContext });

        if (imageUrls && imageUrls.length > 0) {
          for (const imageUrl of imageUrls) {
            try {
              const response = await fetch(imageUrl);
              if (!response.ok) {
                console.warn(`[Gemini] Failed to fetch image ${imageUrl}: HTTP ${response.status}`);
                continue;
              }
              const contentType = response.headers.get('content-type') || '';
              if (!contentType.toLowerCase().startsWith('image/')) {
                console.warn(`[Gemini] URL ${imageUrl} returned non-image content type: ${contentType}`);
                continue;
              }
              const arrayBuffer = await response.arrayBuffer();
              if (arrayBuffer.byteLength === 0) {
                console.warn(`[Gemini] URL ${imageUrl} returned empty image data`);
                continue;
              }
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const cleanMimeType = contentType.split(';')[0].trim();
              messageParts.push({
                inlineData: {
                  mimeType: cleanMimeType,
                  data: base64
                }
              });
            } catch (error) {
              console.warn(`[Gemini] Error processing image ${imageUrl}:`, error);
            }
          }
        }

        const chat = model.startChat({
          history: sanitizedHistory,
          generationConfig: {
            maxOutputTokens: 10000,
          },
        });

        const result = await chat.sendMessage(messageParts);
        const response = await result.response;
        const text = response.text();

        return {
          content: text,
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${candidate} failed:`, err?.message || err);
        // Continue and try next candidate model
        continue;
      }
    }

    throw new Error(`Gemini Error: ${lastError?.message || 'Failed to generate response with Gemini'}`);
  }

  async generateGhibliStyleImage(prompt: string): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const ghibliPrompt = `Create a Studio Ghibli style illustration of: ${prompt}. 
      The image should have the characteristic soft, dreamy, and whimsical art style of Studio Ghibli films, 
      with gentle colors, detailed backgrounds, and a magical atmosphere.`;

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: ghibliPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      if (!response.data || !response.data[0] || !response.data[0].url) {
        throw new Error('No image URL returned from OpenAI');
      }
      return response.data[0].url;

    } catch (error: any) {
      throw new Error(`Image generation error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async analyzeFile(file: File): Promise<{ summary: string; type: string; insights: string[] }> {
    try {
      const fileType = file.type;
      const fileName = file.name;

      // For now, return basic file analysis
      // In a full implementation, you would process the file content
      const analysis = {
        summary: `Uploaded file: ${fileName}`,
        type: fileType,
        insights: [
          `File size: ${(file.size / 1024).toFixed(2)} KB`,
          `File type: ${fileType}`,
          `File name: ${fileName}`
        ]
      };

      // If it's an image, we could analyze it further
      if (fileType.startsWith('image/')) {
        analysis.insights.push('This is an image file that can be processed for Ghibli-style conversion');
      }

      return analysis;

    } catch (error: any) {
      throw new Error(`File analysis error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async convertImageToGhibli(imageFile: File): Promise<string> {
    try {
      // For DALL-E, we can't directly process uploaded images
      // Instead, we'll create a Ghibli-style image based on a description
      const prompt = `Convert this image to Studio Ghibli art style with soft colors, dreamy atmosphere, and whimsical details`;

      return await this.generateGhibliStyleImage(prompt);

    } catch (error: any) {
      throw new Error(`Image conversion error: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

export const aiService = new AIService();