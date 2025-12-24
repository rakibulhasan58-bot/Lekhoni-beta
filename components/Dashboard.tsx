import React, { useState } from 'react';
import { Plus, Book, Trash2, AlertTriangle } from 'lucide-react';
import { Story, Genre } from '../types';

interface DashboardProps {
  stories: Story[];
  onCreateStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'chapters' | 'characters'>) => void;
  onSelectStory: (id: string) => void;
  onDeleteStory: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stories, onCreateStory, onSelectStory, onDeleteStory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState<Genre>(Genre.ROMANCE);
  const [newSynopsis, setNewSynopsis] = useState('');
  const [isAdult, setIsAdult] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateStory({
      title: newTitle,
      genre: newGenre,
      synopsis: newSynopsis,
      isAdult,
    });
    setIsModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewGenre(Genre.ROMANCE);
    setNewSynopsis('');
    setIsAdult(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-serif mb-2">Lekhoni <span className="text-primary-500 text-lg align-top">beta</span></h1>
            <p className="text-gray-500 dark:text-gray-400">Your personal Bengali novel workspace.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
            <Book className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No stories yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start your journey by creating your first novel.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create a Story &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div 
                key={story.id} 
                onClick={() => onSelectStory(story.id)}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden relative"
              >
                <div className={`h-2 w-full ${story.isAdult ? 'bg-red-500' : 'bg-primary-500'}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                      {story.genre}
                    </span>
                    {story.isAdult && (
                      <span className="flex items-center text-xs font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded">
                        18+
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-6 h-10">
                    {story.synopsis || "No synopsis provided."}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <span>Last updated: {new Date(story.updatedAt).toLocaleDateString()}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteStory(story.id); }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Story</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (Bengali/English)</label>
                  <input
                    required
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. পথের পাঁচালী"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value as Genre)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {Object.values(Genre).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Synopsis</label>
                  <textarea
                    value={newSynopsis}
                    onChange={(e) => setNewSynopsis(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    rows={3}
                    placeholder="Short description of your story..."
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input 
                        type="checkbox" 
                        id="isAdult" 
                        checked={isAdult} 
                        onChange={(e) => setIsAdult(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isAdult" className="flex-1 cursor-pointer">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">Mature Content (18+)</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Contains violence, strong language, or adult themes.</span>
                    </label>
                    {isAdult && <AlertTriangle className="w-5 h-5 text-red-500" />}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-md"
                >
                  Create Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
