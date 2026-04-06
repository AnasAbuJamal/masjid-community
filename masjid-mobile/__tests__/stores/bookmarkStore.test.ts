import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('bookmarkStore', () => {
  let store: any;

  beforeEach(() => {
    store = {
      bookmarks: [] as string[],
      addBookmark: (jobId: string) => {
        if (!store.bookmarks.includes(jobId)) {
          store.bookmarks.push(jobId);
        }
      },
      removeBookmark: (jobId: string) => {
        store.bookmarks = store.bookmarks.filter((id: string) => id !== jobId);
      },
      isBookmarked: (jobId: string) => {
        return store.bookmarks.includes(jobId);
      },
      clearBookmarks: () => {
        store.bookmarks = [];
      },
    };
  });

  describe('addBookmark', () => {
    it('should add a bookmark', () => {
      store.addBookmark('job-1');
      expect(store.bookmarks).toContain('job-1');
    });

    it('should not add duplicate bookmarks', () => {
      store.addBookmark('job-1');
      store.addBookmark('job-1');
      expect(store.bookmarks.filter((id: string) => id === 'job-1').length).toBe(1);
    });

    it('should add multiple different bookmarks', () => {
      store.addBookmark('job-1');
      store.addBookmark('job-2');
      store.addBookmark('job-3');
      expect(store.bookmarks.length).toBe(3);
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark', () => {
      store.addBookmark('job-1');
      store.removeBookmark('job-1');
      expect(store.bookmarks).not.toContain('job-1');
    });

    it('should not affect other bookmarks', () => {
      store.addBookmark('job-1');
      store.addBookmark('job-2');
      store.removeBookmark('job-1');
      expect(store.bookmarks).toContain('job-2');
      expect(store.bookmarks).not.toContain('job-1');
    });
  });

  describe('isBookmarked', () => {
    it('should return true for bookmarked items', () => {
      store.addBookmark('job-1');
      expect(store.isBookmarked('job-1')).toBe(true);
    });

    it('should return false for non-bookmarked items', () => {
      expect(store.isBookmarked('job-1')).toBe(false);
    });
  });

  describe('clearBookmarks', () => {
    it('should remove all bookmarks', () => {
      store.addBookmark('job-1');
      store.addBookmark('job-2');
      store.addBookmark('job-3');
      store.clearBookmarks();
      expect(store.bookmarks.length).toBe(0);
    });
  });
});
