import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveConversationContextType {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const ActiveConversationContext = createContext<ActiveConversationContextType | undefined>(undefined);

export function ActiveConversationProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <ActiveConversationContext.Provider value={{ activeConversationId, setActiveConversationId }}>
      {children}
    </ActiveConversationContext.Provider>
  );
}

export function useActiveConversation() {
  const context = useContext(ActiveConversationContext);
  if (context === undefined) {
    throw new Error('useActiveConversation must be used within an ActiveConversationProvider');
  }
  return context;
}

