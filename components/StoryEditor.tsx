import React, { useState, useEffect, useRef } from 'react';
import { Save, ChevronLeft, Plus, Trash2, Users, FileText, Settings, Bot, Moon, Sun, Mic, MicOff, GripVertical, Image as ImageIcon } from 'lucide-react';
import { Story, Chapter, Character } from '../types';
import WritingAssistant from './WritingAssistant';
import VisualStoryView from './VisualStoryView';

interface StoryEditorProps {
  story: Story;
  onSave: (story: Story) => void;
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Add type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const StoryEditor: React.FC<StoryEditorProps> = ({ story, onSave, onBack, isDarkMode, toggleTheme }) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(story.chapters[0]?.id || '');
  const [activeView, setActiveView] = useState<'editor' | 'characters' | 'visuals'>('editor');
  const [showAI, setShowAI] = useState(false);
  const [localStory, setLocalStory] = useState<Story>(story);
  const [isListening, setIsListening] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Refs
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // State Refs for Event Listeners
  const storyRef = useRef(localStory);
  const activeChapterIdRef = useRef(activeChapterId);

  const activeChapter = localStory.chapters.find(c => c.id === activeChapterId);

  // Sync refs with state
  useEffect(() => {
    storyRef.current = localStory;
  }, [localStory]);

  useEffect(() => {
    activeChapterIdRef.current = activeChapterId;
  }, [activeChapterId]);

  useEffect(() => {
    // If no chapter exists, create one
    if (localStory.chapters.length === 0) {
      const newChapter: Chapter = {
        id: crypto.randomUUID(),
        title: 'Chapter 1',
        content: '',
        lastModified: Date.now(),
        scenes: []
      };
      const updatedStory = { ...localStory, chapters: [newChapter] };
      setLocalStory(updatedStory);
      setActiveChapterId(newChapter.id);
      onSave(updatedStory);
    } else if (!activeChapterId && localStory.chapters.length > 0) {
        setActiveChapterId(localStory.chapters[0].id);
    }
  }, [localStory.chapters.length]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Default to Bengali (Bangladesh)

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          // Use Refs to get the latest state inside the event listener
          insertTextWithRefState(finalTranscript + ' ');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          alert('Microphone access denied. Please allow microphone access to use speech-to-text.');
        }
        if (event.error !== 'no-speech') {
             setIsListening(false);
        }
      };
      
      recognition.onend = () => {
          if (isListening) {
             setIsListening(false);
          }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const insertTextWithRefState = (textToInsert: string) => {
    const currentStory = storyRef.current;
    const currentChapterId = activeChapterIdRef.current;
    const currentChapter = currentStory.chapters.find(c => c.id === currentChapterId);

    if (!currentChapter) return;

    let newContent = '';
    
    // Try to insert at cursor if textarea is present and matches the current chapter
    if (textareaRef.current && activeChapterId === currentChapterId) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = currentChapter.content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        newContent = before + textToInsert + after;

        // Restore cursor logic
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = start + textToInsert.length;
                textareaRef.current.selectionStart = newCursorPos;
                textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();
            }
        }, 0);
    } else {
        // Fallback: Append to end
        newContent = currentChapter.content + (currentChapter.content ? ' ' : '') + textToInsert;
    }

    const updatedChapters = currentStory.chapters.map(c => 
      c.id === currentChapterId ? { ...c, content: newContent, lastModified: Date.now() } : c
    );
    
    const newStory = { ...currentStory, chapters: updatedChapters, updatedAt: Date.now() };
    
    // Update State
    setLocalStory(newStory);
    
    // Update Ref immediately to prevent race conditions if speech is fast
    storyRef.current = newStory; 

    // Save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSave(newStory);
    }, 1000);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const handleUpdateChapter = (content: string) => {
    if (!activeChapter) return;
    
    const updatedChapters = localStory.chapters.map(c => 
      c.id === activeChapterId ? { ...c, content, lastModified: Date.now() } : c
    );
    
    const newStory = { ...localStory, chapters: updatedChapters, updatedAt: Date.now() };
    setLocalStory(newStory);

    // Debounced Save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSave(newStory);
    }, 1000);
  };

  const handleFullChapterUpdate = (updatedChapter: Chapter) => {
    const updatedChapters = localStory.chapters.map(c => 
        c.id === updatedChapter.id ? { ...updatedChapter, lastModified: Date.now() } : c
    );
    const newStory = { ...localStory, chapters: updatedChapters, updatedAt: Date.now() };
    setLocalStory(newStory);
    onSave(newStory);
  };

  const handleSetCoverImage = (imageBase64: string) => {
    const updatedStory = { ...localStory, coverImage: imageBase64, updatedAt: Date.now() };
    setLocalStory(updatedStory);
    onSave(updatedStory);
  };

  const handleInsertText = (textToInsert: string) => {
    if (!activeChapter) return;

    if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = activeChapter.content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        // Insert text
        const newContent = before + textToInsert + after;
        handleUpdateChapter(newContent);
        
        // Use timeout to restore cursor position after render
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = start + textToInsert.length;
                textareaRef.current.selectionStart = newCursorPos;
                textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();
            }
        }, 0);
    } else {
        const newContent = activeChapter.content + (activeChapter.content ? '\n\n' : '') + textToInsert;
        handleUpdateChapter(newContent);
    }
  };

  const addNewChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${localStory.chapters.length + 1}`,
      content: '',
      lastModified: Date.now(),
      scenes: []
    };
    const updatedStory = { 
      ...localStory, 
      chapters: [...localStory.chapters, newChapter],
      updatedAt: Date.now()
    };
    setLocalStory(updatedStory);
    setActiveChapterId(newChapter.id);
    onSave(updatedStory);
  };

  const addNewCharacter = () => {
      const newChar: Character = {
          id: crypto.randomUUID(),
          name: 'New Character',
          role: 'Supporting',
          description: ''
      };
      const updatedStory = {
          ...localStory,
          characters: [...localStory.characters, newChar]
      };
      setLocalStory(updatedStory);
      onSave(updatedStory);
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
      const updatedChars = localStory.characters.map(c => 
          c.id === id ? { ...c, [field]: value } : c
      );
      const updatedStory = { ...localStory, characters: updatedChars };
      setLocalStory(updatedStory);
      onSave(updatedStory);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newChapters = [...localStory.chapters];
    const [movedChapter] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(dropIndex, 0, movedChapter);

    const updatedStory = { ...localStory, chapters: newChapters, updatedAt: Date.now() };
    setLocalStory(updatedStory);
    setDraggedIndex(null);
    
    // Save new order immediately
    onSave(updatedStory);
  };

  const isChapterUnsaved = (chapter: Chapter) => {
    const savedChapter = story.chapters.find(c => c.id === chapter.id);
    if (!savedChapter) return true; // New chapter not yet persisted
    return savedChapter.title !== chapter.title || savedChapter.content !== chapter.content;
  };

  const handleBack = () => {
      // Force immediate save of current state before going back
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      onSave(localStory);
      onBack();
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{localStory.title}</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {localStory.isAdult && <span className="text-red-500 font-bold mr-2">18+</span>}
              {localStory.chapters.length} Chapters • {localStory.characters.length} Characters
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all duration-300 ${
                    isListening 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Speech to Text (Bengali)"
            >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button 
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
                onClick={() => setShowAI(!showAI)}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showAI ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
                <Bot className="w-4 h-4 mr-2" />
                AI Assist
            </button>
            <button className="flex items-center px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-medium">
                <Save className="w-4 h-4 mr-2" />
                Saved
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <div className="p-2 flex space-x-1 border-b border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setActiveView('editor')}
              className={`flex-1 py-2 text-xs font-medium rounded flex justify-center items-center ${activeView === 'editor' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Editor"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveView('visuals')}
              className={`flex-1 py-2 text-xs font-medium rounded flex justify-center items-center ${activeView === 'visuals' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Visuals"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveView('characters')}
              className={`flex-1 py-2 text-xs font-medium rounded flex justify-center items-center ${activeView === 'characters' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Characters"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {(activeView === 'editor' || activeView === 'visuals') && (
              <div className="space-y-1">
                {localStory.chapters.map((chapter, index) => (
                  <div 
                    key={chapter.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group flex items-center gap-1 p-1 rounded-md transition-all border ${
                        activeChapterId === chapter.id 
                        ? 'bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-800 shadow-sm' 
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    } ${draggedIndex === index ? 'opacity-50 border-dashed border-gray-400' : ''}`}
                  >
                    <div className="cursor-grab text-gray-300 hover:text-gray-500 p-1 flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                        onClick={() => setActiveChapterId(chapter.id)}
                        className="flex-1 text-left py-1.5 text-sm flex items-center justify-between min-w-0"
                    >
                        <span className={`truncate ${activeChapterId === chapter.id ? 'font-medium text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {chapter.title}
                        </span>
                        {isChapterUnsaved(chapter) && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 ml-2" title="Unsaved changes" />
                        )}
                    </button>
                  </div>
                ))}
                <button onClick={addNewChapter} className="w-full mt-3 flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors">
                  <Plus className="w-4 h-4 mr-1" /> New Chapter
                </button>
              </div>
            )}

            {activeView === 'characters' && (
              <div className="space-y-2">
                 {localStory.characters.map((char) => (
                     <div key={char.id} className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                         <input 
                            value={char.name}
                            onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                            className="w-full text-sm font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-800 dark:text-gray-200 mb-1"
                         />
                         <input 
                            value={char.role}
                            onChange={(e) => updateCharacter(char.id, 'role', e.target.value)}
                            className="w-full text-xs text-gray-500 dark:text-gray-400 bg-transparent border-none focus:ring-0 p-0"
                         />
                     </div>
                 ))}
                 <button onClick={addNewCharacter} className="w-full mt-2 flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors">
                  <Users className="w-4 h-4 mr-1" /> Add Character
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative flex justify-center">
          {activeView === 'editor' && activeChapter && (
            <div className="w-full max-w-3xl py-12 px-8 min-h-full bg-white dark:bg-gray-900 shadow-sm dark:shadow-none">
                {localStory.coverImage && (
                  <div className="w-full aspect-video relative mb-8 rounded-xl overflow-hidden shadow-lg group">
                    <img src={localStory.coverImage} alt="Story Cover" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleSetCoverImage('')}
                      className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Remove Cover Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                    type="text"
                    value={activeChapter.title}
                    onChange={(e) => {
                        const newTitle = e.target.value;
                        const updatedChapters = localStory.chapters.map(c => 
                            c.id === activeChapterId ? { ...c, title: newTitle } : c
                        );
                        const updatedStory = { ...localStory, chapters: updatedChapters };
                        setLocalStory(updatedStory);
                        // Debounce title saves
                        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                        saveTimeoutRef.current = setTimeout(() => {
                            onSave(updatedStory);
                        }, 1000);
                    }}
                    className="w-full text-3xl font-bold text-gray-900 dark:text-gray-100 border-none focus:ring-0 placeholder-gray-300 mb-6 bg-transparent"
                    placeholder="Chapter Title"
                />
                <textarea
                    ref={textareaRef}
                    value={activeChapter.content}
                    onChange={(e) => handleUpdateChapter(e.target.value)}
                    placeholder={isListening ? "Listening... Speak now." : "Start writing your Bengali masterpiece here..."}
                    className="w-full h-[calc(100vh-250px)] resize-none border-none focus:ring-0 text-lg leading-loose text-gray-800 dark:text-gray-300 font-serif bg-transparent outline-none"
                    spellCheck={false}
                />
            </div>
          )}

          {activeView === 'visuals' && activeChapter && (
             <VisualStoryView 
                story={localStory}
                chapter={activeChapter}
                onUpdateChapter={handleFullChapterUpdate}
             />
          )}
          
          {activeView === 'characters' && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Users className="w-16 h-16 mb-4 opacity-20" />
                  <p>Select a character from the sidebar to edit details</p>
              </div>
          )}
        </main>

        {/* AI Sidebar */}
        {showAI && activeView === 'editor' && (
            <WritingAssistant 
                story={localStory} 
                currentChapterTitle={activeChapter?.title || ''}
                currentChapterContent={activeChapter?.content || ''} 
                onInsert={handleInsertText}
                onSetCoverImage={handleSetCoverImage}
            />
        )}
      </div>
    </div>
  );
};

export default StoryEditor;