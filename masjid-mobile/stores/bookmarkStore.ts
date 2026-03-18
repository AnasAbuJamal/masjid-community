import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@masjid:bookmarks';

interface BookmarkState {
  savedJobs: string[];
  savedEvents: string[];
  isLoading: boolean;
  initialize: () => Promise<void>;
  toggleJobBookmark: (jobId: string) => Promise<void>;
  toggleEventBookmark: (eventId: string) => Promise<void>;
  isJobSaved: (jobId: string) => boolean;
  isEventSaved: (eventId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  savedJobs: [],
  savedEvents: [],
  isLoading: true,

  initialize: async () => {
    try {
      const bookmarksStr = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksStr) {
        const bookmarks = JSON.parse(bookmarksStr);
        set({ savedJobs: bookmarks.jobs || [], savedEvents: bookmarks.events || [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  toggleJobBookmark: async (jobId: string) => {
    const { savedJobs } = get();
    let newSaved: string[];
    
    if (savedJobs.includes(jobId)) {
      newSaved = savedJobs.filter(id => id !== jobId);
    } else {
      newSaved = [...savedJobs, jobId];
    }
    
    set({ savedJobs: newSaved });
    await saveBookmarks(get().savedJobs, get().savedEvents);
  },

  toggleEventBookmark: async (eventId: string) => {
    const { savedEvents } = get();
    let newSaved: string[];
    
    if (savedEvents.includes(eventId)) {
      newSaved = savedEvents.filter(id => id !== eventId);
    } else {
      newSaved = [...savedEvents, eventId];
    }
    
    set({ savedEvents: newSaved });
    await saveBookmarks(get().savedJobs, get().savedEvents);
  },

  isJobSaved: (jobId: string) => {
    return get().savedJobs.includes(jobId);
  },

  isEventSaved: (eventId: string) => {
    return get().savedEvents.includes(eventId);
  },
}));

async function saveBookmarks(jobs: string[], events: string[]) {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify({ jobs, events }));
}

export default useBookmarkStore;
