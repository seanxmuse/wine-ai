// Mock Supabase for testing without backend
// Replace import in App.js to use this for quick testing

export const supabase = {
  auth: {
    getSession: async () => ({
      data: {
        session: {
          user: { id: 'test-user-123', email: 'test@test.com' }
        }
      }
    }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
  },
  from: () => ({
    insert: async () => ({ data: null, error: null }),
    select: () => ({
      single: async () => ({ data: { id: 'test-scan' }, error: null }),
    }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: 'test.jpg' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://test.jpg' } }),
    }),
  },
};
