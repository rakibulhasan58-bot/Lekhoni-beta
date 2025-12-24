import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview'; // Good balance of speed and creative capability
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image'; // Changed to widely available model to prevent 403 errors

export const generateStoryIdea = async (genre: string, isAdult: boolean): Promise<string> => {
  try {
    const prompt = `Generate a unique and engaging story idea for a Bengali novel in the ${genre} genre. 
    ${isAdult ? 'The story is intended for a mature audience (18+), so it can deal with complex, dark, or romantic themes deeply.' : 'Keep the content suitable for general audiences.'}
    Provide the output in Bengali language primarily, with an English translation in parentheses for the title.
    Format:
    Title: [Bengali Title]
    Synopsis: [Brief plot summary in Bengali]`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.8, // High creativity
        systemInstruction: "You are a creative writing assistant specializing in Bengali literature.",
      }
    });

    return response.text || "Could not generate idea.";
  } catch (error) {
    console.error("Gemini Idea Error:", error);
    return "Error generating idea. Please check your API key or connection.";
  }
};

export const expandText = async (currentText: string, context: string): Promise<string> => {
  try {
    // Use the last 500 characters for immediate context as requested
    const recentText = currentText ? currentText.slice(-500) : ""; 

    const prompt = `You are an expert Bengali novelist acting as a co-author. Your task is to continue the story seamlessly.

[STORY CONTEXT]
${context}

[RECENT NARRATIVE]
"...${recentText}"

[WRITING INSTRUCTIONS]
1. **Analyze Context**: Integrate the 'Synopsis' and 'Current Chapter Title' into the narrative flow.
2. **Character Voice & Consistency**: STRICTLY ADHERE to the [CHARACTERS & PROFILES] section provided in the context. Ensure character dialogue, actions, and mannerisms exactly match their roles and descriptions.
3. **Match Tone**: Analyze the [RECENT NARRATIVE] for vocabulary (Sadhu/Chalit) and pacing. Maintain this exact style.
4. **Foreshadowing & Twists**: Incorporate subtle foreshadowing or narrative hints that suggest potential future plot twists based on the synopsis.
5. **Task**: Write the next 2-3 logical paragraphs in Bengali.
6. **Constraint**: Do not repeat the recent narrative. Start exactly where the text ends.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Expand Error:", error);
    return "";
  }
};

export const suggestCharacter = async (genre: string): Promise<string> => {
  try {
    const prompt = `Create a detailed character profile for a ${genre} novel in Bengali.
    Include: Name, Age, Role, Physical Description, and a Secret they are hiding.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Character Error:", error);
    return "";
  }
};

export const translateToBengali = async (text: string): Promise<string> => {
  try {
    const prompt = `Translate the following text into natural, literary Bengali (Sadhu or Chalit bhasha suitable for novels): "${text}"`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "Translation failed.";
  }
};

export const generateSceneDescription = async (chapterContent: string, genre: string): Promise<string> => {
    try {
        const prompt = `Analyze the following story segment (Genre: ${genre}). 
        Extract a vivid, detailed visual description of a key scene suitable for an AI image generator. 
        Focus on lighting, colors, character appearance, and environment. 
        Keep it in English for better image generation results.
        
        Text Segment:
        "${chapterContent.slice(0, 2000)}..."`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "A dramatic scene from the story.";
    } catch (error) {
        return "A scene from the story.";
    }
};

export const generateImage = async (
  prompt: string, 
  options: { isAdult: boolean; style?: string; count?: number }
): Promise<string[]> => {
  const { isAdult, style = 'Bengali Art', count = 1 } = options;

  const stylePrompts: Record<string, string> = {
    'Cinematic': 'Visual Style: Cinematic, high-contrast, moody, dramatic lighting, 8k resolution, highly detailed, depth of field. Use deep colors and atmospheric shadows.',
    'Photorealistic': 'Visual Style: Photorealistic, 8k resolution, raw photo, realistic textures, ray tracing, hyper-realism.',
    'Anime': 'Visual Style: Anime style, vibrant colors, detailed backgrounds, emotional atmosphere, distinct character designs.',
    'Watercolor': 'Visual Style: Watercolor painting, soft edges, artistic, dreamy, paper texture, fluid strokes.',
    'Impressionistic': 'Visual Style: Impressionist painting, visible brushstrokes, emphasis on light and movement, vibrant colors, artistic interpretation.',
    'Surrealist': 'Visual Style: Surrealism, dream-like imagery, illogical scenes, unexpected juxtapositions, subconscious themes, Salvador Dali inspired.',
    'Bengali Art': 'Visual Style: Emulate the distinct aesthetic of popular Bengali novel (Upanyas) covers found in Kolkata. Blend modern digital art with traditional Bengali artistic touches.',
    'Digital Art': 'Visual Style: High quality digital art, vibrant, clear, detailed.'
  };

  const selectedStyle = stylePrompts[style] || stylePrompts['Digital Art'];
  
  const contentStyle = isAdult 
    ? "Tone: Mature, serious, sophisticated composition."
    : "Tone: Inviting, clear, suitable for general audiences.";

  const imagePrompt = `Generate a high-quality digital illustration.
    Scene Description: ${prompt}. 
    ${selectedStyle}
    ${contentStyle}
    Quality: 4k resolution, masterpiece.`;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to perform a single generation request
  const generateSingleImage = async (): Promise<string> => {
      try {
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL_NAME,
          contents: {
            parts: [{ text: imagePrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            }
          }
        });

        let refusalText = "";
        // Iterate through parts to find the image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
          if (part.text) {
              refusalText += part.text;
          }
        }
        
        if (refusalText) {
            console.warn("Gemini Image Refusal:", refusalText);
            throw new Error(`Model Refused: ${refusalText.slice(0, 100)}...`);
        }
        throw new Error("No image data returned from API");
      } catch (error: any) {
          throw error;
      }
  };

  const successfulImages: string[] = [];

  // Sequential Execution Loop to handle Rate Limits (429)
  // We process one by one with delays to stay within quota.
  for (let i = 0; i < count; i++) {
      let attempts = 0;
      let generated = false;

      while (attempts < 3 && !generated) {
          try {
              const img = await generateSingleImage();
              successfulImages.push(img);
              generated = true;
          } catch (error: any) {
              attempts++;
              
              // Check for Rate Limit / Quota Exceeded
              const isRateLimit = 
                  (error.message && error.message.includes('429')) ||
                  (error.status === 429) ||
                  (error.error && error.error.code === 429) ||
                  (error.message && error.message.includes('RESOURCE_EXHAUSTED'));

              if (isRateLimit) {
                  // Exponential backoff: 2s, 4s, 8s
                  const waitTime = 2000 * Math.pow(2, attempts);
                  console.warn(`Quota exceeded (429). Retrying image ${i+1}/${count} in ${waitTime/1000}s...`);
                  await delay(waitTime);
              } else {
                  console.error(`Image ${i+1} failed:`, error);
                  // If it's not a rate limit error (e.g. safety), break inner loop to skip this image
                  break; 
              }
          }
      }

      // If successful, add a polite delay before the next request to avoid triggering rate limit again immediately
      if (generated && i < count - 1) {
          await delay(2000); 
      }
  }

  if (successfulImages.length === 0) {
      throw new Error("Unable to generate images. Please check your API quota.");
  }

  return successfulImages;
};