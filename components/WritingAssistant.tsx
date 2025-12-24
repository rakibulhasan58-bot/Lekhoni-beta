import React, { useState } from 'react';
import { Sparkles, Languages, UserPlus, BookOpen, Loader2 } from 'lucide-react';
import { generateStoryIdea, expandText, suggestCharacter, translateToBengali } from '../services/geminiService';
import { Story } from '../types';

interface WritingAssistantProps {
  story: Story;
  currentChapterTitle: string;
  currentChapterContent: string;
  onInsert: (text: string) => void;
}

const WritingAssistant: React.FC<WritingAssistantProps> = ({ story, currentChapterTitle, currentChapterContent, onInsert }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'idea' | 'expand' | 'char' | 'trans'>('expand');
  const [inputText, setInputText] = useState('');

  const handleAction = async () => {
    setLoading(true);
    setResult(null);
    let output = '';

    try {
      switch (activeTab) {
        case 'idea':
          output = await generateStoryIdea(story.genre, story.isAdult);
          break;
        case 'expand':
          const charList = story.characters.length > 0
            ? story.characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')
            : 'No specific character profiles created yet.';
            
          // Enhanced context formatting with clear headings as requested
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
        case 'char':
          output = await suggestCharacter(story.genre);
          break;
        case 'trans':
          output = await translateToBengali(inputText);
          break;
      }
      setResult(output);
    } catch (e) {
      setResult("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        {activeTab === 'trans' && (
          <textarea
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
            placeholder="Enter text to translate to Bengali..."
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
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
              Thinking...
            </>
          ) : (
            'Generate'
          )}
        </button>

        {result && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Result</h3>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-serif leading-relaxed">
              {result}
            </p>
            <button
              onClick={() => onInsert(result)}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium border border-primary-200 dark:border-primary-800 rounded px-2 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
            >
              + Insert into Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingAssistant;