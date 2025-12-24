import React, { useState, useEffect } from 'react';
import { Sparkles, Languages, UserPlus, BookOpen, Loader2, Image as ImageIcon, Download, AlertTriangle, RefreshCw, AlertCircle, Palette, Layers } from 'lucide-react';
import { generateStoryIdea, expandText, suggestCharacter, translateToBengali, generateImage, generateSceneDescription } from '../services/geminiService';
import { Story } from '../types';

interface WritingAssistantProps {
  story: Story;
  currentChapterTitle: string;
  currentChapterContent: string;
  onInsert: (text: string) => void;
  onSetCoverImage: (imageBase64: string) => void;
}

const WritingAssistant: React.FC<WritingAssistantProps> = ({ story, currentChapterTitle, currentChapterContent, onInsert, onSetCoverImage }) => {
  const [loading, setLoading] = useState(false);
  // result can now be a string (text/idea) or string[] (images)
  const [result, setResult] = useState<string | string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'idea' | 'expand' | 'char' | 'trans' | 'image'>('expand');
  const [inputText, setInputText] = useState('');
  const [isMatureMode, setIsMatureMode] = useState(story.isAdult);
  
  // Image Generation Options
  const [imageStyle, setImageStyle] = useState('Bengali Art');
  const [imageCount, setImageCount] = useState(1);

  const imageStyles = ['Bengali Art', 'Cinematic', 'Photorealistic', 'Anime', 'Watercolor', 'Impressionistic', 'Surrealist', 'Digital Art'];

  // Sync mature mode with story setting when story changes
  useEffect(() => {
    setIsMatureMode(story.isAdult);
  }, [story.isAdult]);

  // Clear result and error when tab changes
  useEffect(() => {
    setResult(null);
    setError(null);
    setInputText('');
  }, [activeTab]);

  const handleAction = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    let output: string | string[] | null = '';

    try {
      switch (activeTab) {
        case 'idea':
          output = await generateStoryIdea(story.genre, story.isAdult);
          break;
        case 'expand': {
          const charList = story.characters.length > 0
            ? story.characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')
            : 'No specific character profiles created yet.';
            
          const context = `STORY METADATA:
Title: ${story.title}
Genre: ${story.genre}

=== SYNOPSIS ===
${story.synopsis}

=== CURRENT CHAPTER TITLE ===
${currentChapterTitle}

=== CHARACTERS & PROFILES ===
${charList}`;
          output = await expandText(currentChapterContent, context);
          break;
        }
        case 'char':
          output = await suggestCharacter(story.genre);
          break;
        case 'trans':
          output = await translateToBengali(inputText);
          break;
        case 'image': {
          let basePrompt = inputText.trim();
          
          if (!basePrompt) {
            // If no user input, automatically extract a scene description from the recent content
            if (currentChapterContent && currentChapterContent.length > 50) {
                // Use the last 1500 characters to ensure we capture the current scene context
                const recentContent = currentChapterContent.slice(-1500);
                basePrompt = await generateSceneDescription(recentContent, story.genre);
            } else {
                // Fallback context from story metadata
                basePrompt = `
                  Story Title: "${story.title}"
                  Genre: ${story.genre}
                  Full Synopsis: ${story.synopsis}
                `.trim();
            }
          } else {
             // User input exists. Append story context to enrich the prompt.
             basePrompt = `
               User Description: "${basePrompt}"
               
               [Story Context]
               Title: "${story.title}"
               Genre: ${story.genre}
               Synopsis: ${story.synopsis.slice(0, 500)}...
             `.trim();
          }

          // Generate images with new parameters
          output = await generateImage(basePrompt, { 
              isAdult: isMatureMode,
              style: imageStyle,
              count: imageCount
          });
          break;
        }
      }
      setResult(output);
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('403')) {
        setError("Permission denied. Your API key may not support this model. Using a free key?");
      } else if (e.message && (e.message.includes('Refused') || e.message.includes('Safety') || e.message.includes('PROHIBITED'))) {
        setError("Content prohibited by safety policies. Try a different prompt.");
      } else {
        setError("An error occurred while generating content. Please try again.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isImageResult = activeTab === 'image' && Array.isArray(result) && result.length > 0;
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-80 shadow-xl z-20">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-bold flex items-center text-primary-700 dark:text-primary-500">
          <Sparkles className="w-5 h-5 mr-2" />
          AI Assistant
        </h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('expand')}
          className={`flex-1 p-3 text-sm flex justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'expand' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          title="Continue Writing"
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 p-3 text-sm flex justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'image' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          title="Generate Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('idea')}
          className={`flex-1 p-3 text-sm flex justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'idea' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          title="Ideas"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('char')}
          className={`flex-1 p-3 text-sm flex justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'char' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          title="Characters"
        >
          <UserPlus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('trans')}
          className={`flex-1 p-3 text-sm flex justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'trans' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          title="Translate"
        >
          <Languages className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(activeTab === 'trans' || activeTab === 'image') && (
          <div className="space-y-3">
            <textarea
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder={activeTab === 'image' ? "Describe the image or leave empty to use story context..." : "Enter text to translate to Bengali..."}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            {activeTab === 'image' && (
               <div className="space-y-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                 {/* Style Selector */}
                 <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <Palette className="w-3 h-3 mr-1" /> Image Style
                    </label>
                    <select 
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                        className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 focus:ring-1 focus:ring-primary-500 outline-none"
                    >
                        {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>

                 {/* Count Selector */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                            <Layers className="w-3 h-3 mr-1" /> Image Count
                        </label>
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 px-2 py-0.5 rounded">
                            {imageCount}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            step="1"
                            value={imageCount}
                            onChange={(e) => setImageCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                        <span>1</span>
                        <span>30</span>
                    </div>
                 </div>

                 {/* Mature Toggle */}
                 <div className="flex items-center space-x-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                   <input 
                     type="checkbox" 
                     id="matureMode"
                     checked={isMatureMode}
                     onChange={(e) => setIsMatureMode(e.target.checked)}
                     className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                   />
                   <label htmlFor="matureMode" className="text-xs text-gray-600 dark:text-gray-400 flex items-center cursor-pointer select-none">
                     Mature Style (18+)
                     {isMatureMode && <AlertTriangle className="w-3 h-3 ml-1 text-red-500" />}
                   </label>
                 </div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'expand' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Based on your current chapter content, the AI will suggest the next few paragraphs.
          </p>
        )}
        
        {activeTab === 'idea' && (
           <p className="text-xs text-gray-500 dark:text-gray-400 italic">
             Generate a plot twist or a new story idea based on the genre: {story.genre}.
           </p>
        )}

        <button
          onClick={handleAction}
          disabled={loading || (activeTab === 'trans' && !inputText)}
          className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-md shadow-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Generate'
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-200 dark:border-red-800 flex items-start">
             <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
             <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Result</h3>
            
            {isImageResult ? (
              <div className="grid grid-cols-1 gap-4">
                {(result as string[]).map((imgUrl, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                          <img src={imgUrl} alt={`Generated Art ${idx + 1}`} className="w-full h-auto object-cover" />
                          <a 
                            href={imgUrl} 
                            download={`lekhoni-art-${Date.now()}-${idx}.png`}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white px-1.5 rounded">{idx + 1}/{result.length}</span>
                        </div>
                        <button
                          onClick={() => onSetCoverImage(imgUrl)}
                          className="w-full text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium border border-primary-200 dark:border-primary-800 rounded px-2 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors flex items-center justify-center"
                        >
                          <ImageIcon className="w-3 h-3 mr-1.5" /> Set as Cover
                        </button>
                    </div>
                ))}
              </div>
            ) : (
              // Text Result
              typeof result === 'string' && (
                  <>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-serif leading-relaxed">
                      {result}
                    </p>
                    <button
                      onClick={() => onInsert(result)}
                      className="mt-3 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium border border-primary-200 dark:border-primary-800 rounded px-2 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      + Insert into Story
                    </button>
                  </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingAssistant;