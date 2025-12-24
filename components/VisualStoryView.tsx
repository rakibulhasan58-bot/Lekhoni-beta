import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Wand2, Loader2, Maximize2, X, AlertTriangle, Download, AlertCircle, Settings, Palette, Layers, Check } from 'lucide-react';
import { Chapter, Story, Scene } from '../types';
import { generateImage, generateSceneDescription } from '../services/geminiService';

interface VisualStoryViewProps {
  story: Story;
  chapter: Chapter;
  onUpdateChapter: (updatedChapter: Chapter) => void;
}

const VisualStoryView: React.FC<VisualStoryViewProps> = ({ story, chapter, onUpdateChapter }) => {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Map<string, string>>(new Map());
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Global Settings for this view
  const [globalStyle, setGlobalStyle] = useState('Cinematic');
  const [globalCount, setGlobalCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const imageStyles = ['Cinematic', 'Bengali Art', 'Photorealistic', 'Anime', 'Watercolor', 'Impressionistic', 'Surrealist', 'Digital Art'];

  const scenes = chapter.scenes || [];

  const handleAddScene = async () => {
    // Auto-generate a prompt based on content if available
    let initialPrompt = "A key scene from this chapter...";
    if (chapter.content.length > 50) {
       // Use a slice to prevent token limits on huge chapters, but enough for context
       initialPrompt = await generateSceneDescription(chapter.content.slice(0, 5000), story.genre);
    }

    const newScene: Scene = {
      id: crypto.randomUUID(),
      description: initialPrompt,
      timestamp: Date.now(),
      variants: []
    };
    
    const updatedScenes = [...scenes, newScene];
    onUpdateChapter({ ...chapter, scenes: updatedScenes });
  };

  const handleUpdateScene = (id: string, description: string) => {
    const updatedScenes = scenes.map(s => s.id === id ? { ...s, description } : s);
    onUpdateChapter({ ...chapter, scenes: updatedScenes });
    // Clear error for this scene when user modifies description
    if (errorIds.has(id)) {
        const newErrors = new Map(errorIds);
        newErrors.delete(id);
        setErrorIds(newErrors);
    }
  };

  const handleDeleteScene = (id: string) => {
      if(window.confirm("Delete this scene?")) {
        const updatedScenes = scenes.filter(s => s.id !== id);
        onUpdateChapter({ ...chapter, scenes: updatedScenes });
        const newErrors = new Map(errorIds);
        newErrors.delete(id);
        setErrorIds(newErrors);
      }
  };

  const handleGenerateImage = async (scene: Scene) => {
    setLoadingIds(prev => new Set(prev).add(scene.id));
    setErrorIds(prev => {
        const next = new Map(prev);
        next.delete(scene.id);
        return next;
    });

    try {
      const images = await generateImage(scene.description, { 
          isAdult: story.isAdult,
          style: globalStyle,
          count: globalCount
      });
      
      if (images && images.length > 0) {
        // Append new images to existing variants
        const updatedScenes = scenes.map(s => {
          if (s.id === scene.id) {
             const existingVariants = s.variants || [];
             // If this is the first image, or if we want to show the newest one
             const newVariants = [...images, ...existingVariants];
             return { 
                 ...s, 
                 imageUrl: images[0], // Show the first new image as current
                 variants: newVariants 
             };
          }
          return s;
        });
        onUpdateChapter({ ...chapter, scenes: updatedScenes });
      }
    } catch (error: any) {
      console.error("Scene Generation Error:", error);
      let errorMessage = "Failed to generate image.";
      
      const msg = error.message || '';

      if (msg.includes('403')) {
          errorMessage = "Permission denied (403). API key issue.";
      } else if (msg.includes('429')) {
          errorMessage = "Too many requests. Wait a moment.";
      } else if (msg.includes('Refused') || msg.includes('Safety') || msg.includes('PROHIBITED')) {
          errorMessage = "Content blocked by safety filters. Modify prompt.";
      } else if (msg.includes('No image data')) {
          errorMessage = "No image returned. Try modifying the prompt.";
      }

      setErrorIds(prev => {
          const next = new Map(prev);
          next.set(scene.id, errorMessage);
          return next;
      });
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
    }
  };

  const handleSelectVariant = (sceneId: string, variantUrl: string) => {
      const updatedScenes = scenes.map(s => 
          s.id === sceneId ? { ...s, imageUrl: variantUrl } : s
      );
      onUpdateChapter({ ...chapter, scenes: updatedScenes });
  };

  const handleDeleteVariant = (sceneId: string, variantUrl: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm("Remove this image variant?")) return;

      const updatedScenes = scenes.map(s => {
          if (s.id === sceneId) {
              const newVariants = (s.variants || []).filter(v => v !== variantUrl);
              // If we deleted the active image, pick the first available one, or undefined
              let newImageUrl = s.imageUrl;
              if (s.imageUrl === variantUrl) {
                  newImageUrl = newVariants.length > 0 ? newVariants[0] : undefined;
              }
              return { ...s, imageUrl: newImageUrl, variants: newVariants };
          }
          return s;
      });
      onUpdateChapter({ ...chapter, scenes: updatedScenes });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-serif">Visual Storyboard</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualize {chapter.title} with AI-generated scenes.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
             {story.isAdult && (
                <div className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800 text-xs font-bold">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    18+ Mode
                </div>
            )}
            
            <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showSettings ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/50 dark:border-primary-500 dark:text-primary-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Config
                </button>
                
                {showSettings && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-20">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                                    <Palette className="w-3 h-3 mr-1" /> Image Style
                                </label>
                                <select 
                                    value={globalStyle}
                                    onChange={(e) => setGlobalStyle(e.target.value)}
                                    className="w-full p-2 text-sm rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-1 focus:ring-primary-500 outline-none"
                                >
                                    {imageStyles.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                        <Layers className="w-3 h-3 mr-1" /> Generation Batch Size
                                    </label>
                                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 px-2 py-0.5 rounded">
                                        {globalCount}
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="30" 
                                    step="1"
                                    value={globalCount}
                                    onChange={(e) => setGlobalCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>1</span>
                                    <span>30</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {scenes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-4">
                <ImageIcon className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No visuals yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Bring your characters and settings to life. Create your first storyboard scene based on your chapter content.
            </p>
            <button
              onClick={handleAddScene}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-md flex items-center transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Scene
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {scenes.map((scene) => (
              <div key={scene.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-xl transition-shadow duration-300">
                {/* Image Area */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                  {scene.imageUrl ? (
                    <>
                      <img 
                        src={scene.imageUrl} 
                        alt="Scene" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 z-10">
                         <button 
                            onClick={() => setActiveImage(scene.imageUrl!)}
                            className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors"
                            title="View Fullscreen"
                         >
                            <Maximize2 className="w-6 h-6" />
                         </button>
                         <a 
                            href={scene.imageUrl} 
                            download={`lekhoni-scene-${scene.id}.png`}
                            className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white transition-colors"
                            title="Download"
                         >
                            <Download className="w-6 h-6" />
                         </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">Image not generated</p>
                    </div>
                  )}

                  {/* Variants Overlay */}
                  {scene.variants && scene.variants.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 p-1 bg-black/50 backdrop-blur-md rounded-lg z-20 max-w-[95%] overflow-x-auto custom-scrollbar">
                          {scene.variants.map((v, idx) => (
                              <div key={idx} className="relative group/variant flex-shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSelectVariant(scene.id, v); }}
                                    className={`w-10 h-6 rounded overflow-hidden border transition-all ${scene.imageUrl === v ? 'border-primary-500 ring-1 ring-primary-500' : 'border-white/30 hover:border-white'}`}
                                >
                                    <img src={v} className="w-full h-full object-cover" alt={`V${idx}`} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteVariant(scene.id, v, e)}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/variant:opacity-100 transition-opacity"
                                    title="Delete Variant"
                                >
                                    <X className="w-2 h-2" />
                                </button>
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Loading Overlay */}
                  {loadingIds.has(scene.id) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
                      <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary-500" />
                      <span className="text-sm font-medium animate-pulse">
                          {globalCount > 1 ? `Painting ${globalCount} variations...` : 'Painting scene...'}
                      </span>
                    </div>
                  )}
                  
                  {/* Error Overlay */}
                  {errorIds.has(scene.id) && !loadingIds.has(scene.id) && (
                      <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/90 flex flex-col items-center justify-center text-red-600 dark:text-red-200 p-4 text-center z-30">
                          <AlertCircle className="w-8 h-8 mb-2" />
                          <span className="text-xs font-bold">{errorIds.get(scene.id)}</span>
                          <button 
                            onClick={() => handleGenerateImage(scene)}
                            className="mt-2 text-xs underline hover:text-red-800 dark:hover:text-white"
                          >
                              Try Again
                          </button>
                      </div>
                  )}
                </div>

                {/* Controls Area */}
                <div className="p-4 flex flex-col flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2">Scene Description (Prompt)</label>
                  <textarea
                    value={scene.description}
                    onChange={(e) => handleUpdateScene(scene.id, e.target.value)}
                    className="w-full text-sm p-3 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-4 text-gray-700 dark:text-gray-300 flex-1"
                    rows={3}
                    placeholder="Describe the scene visuals..."
                  />
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete Scene"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleGenerateImage(scene)}
                        disabled={loadingIds.has(scene.id) || !scene.description.trim()}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-md text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {scene.imageUrl ? 'Generate More' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

             {/* Add New Button Card */}
             <button 
                onClick={handleAddScene}
                className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-6 text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group min-h-[400px]"
             >
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8" />
                </div>
                <span className="font-medium">Add New Scene</span>
             </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setActiveImage(null)}>
           <button 
             className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"
             onClick={() => setActiveImage(null)}
           >
             <X className="w-8 h-8" />
           </button>
           <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={activeImage} 
                alt="Full Scene" 
                className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default VisualStoryView;