import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import StoryEditor from './components/StoryEditor';
import { Story, ViewState } from './types';

const STORAGE_KEY = 'lekhoni_stories_v1';
const THEME_KEY = 'lekhoni_theme';

const App: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedStories = localStorage.getItem(STORAGE_KEY);
    if (savedStories) {
      try {
        setStories(JSON.parse(savedStories));
      } catch (e) {
        console.error("Failed to load stories", e);
      }
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Save to local storage whenever stories change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  }, [stories]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreateStory = (newStoryData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'chapters' | 'characters'>) => {
    const newStory: Story = {
      ...newStoryData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [],
      characters: [],
    };
    setStories([newStory, ...stories]);
    setActiveStoryId(newStory.id);
    setViewState(ViewState.EDITOR);
  };

  const handleSelectStory = (id: string) => {
    setActiveStoryId(id);
    setViewState(ViewState.EDITOR);
  };

  const handleDeleteStory = (id: string) => {
    if (window.confirm("Are you sure you want to delete this story? This cannot be undone.")) {
      setStories(stories.filter(s => s.id !== id));
      if (activeStoryId === id) {
        setViewState(ViewState.DASHBOARD);
        setActiveStoryId(null);
      }
    }
  };

  const handleUpdateStory = (updatedStory: Story) => {
    setStories(stories.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const handleBackToDashboard = () => {
    setViewState(ViewState.DASHBOARD);
    setActiveStoryId(null);
  };

  const activeStory = stories.find(s => s.id === activeStoryId);

  return (
    <div className="font-sans antialiased text-gray-900 dark:text-gray-100">
      {viewState === ViewState.DASHBOARD && (
        <Dashboard
          stories={stories}
          onCreateStory={handleCreateStory}
          onSelectStory={handleSelectStory}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {viewState === ViewState.EDITOR && activeStory && (
        <StoryEditor
          story={activeStory}
          onSave={handleUpdateStory}
          onBack={handleBackToDashboard}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;
