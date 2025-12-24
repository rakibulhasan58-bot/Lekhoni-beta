import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview'; // Good balance of speed and creative capability

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
    const recentText = currentText.slice(-500); 

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