-- Migration: Add wines JSONB column to chat_messages table
-- Purpose: Store wine analysis results with chat messages for persistence
-- Date: 2025-11-26

-- Add wines column to store Wine[] array for messages with wine analysis
ALTER TABLE chat_messages
ADD COLUMN wines JSONB DEFAULT NULL;

-- Add index for querying messages with wine data
CREATE INDEX chat_messages_wines_idx
ON chat_messages USING GIN (wines)
WHERE wines IS NOT NULL;

-- Add comment
COMMENT ON COLUMN chat_messages.wines IS 'Wine analysis results as JSON array for assistant messages. Stores complete Wine objects including prices, scores, and metadata.';
