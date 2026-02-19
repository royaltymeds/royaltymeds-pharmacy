-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL, -- Array of user IDs in conversation
  subject VARCHAR(255),
  conversation_type VARCHAR(20) DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachment_url VARCHAR(500), -- URL to uploaded file/image
  attachment_type VARCHAR(50), -- 'image', 'pdf', 'document', etc.
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_by UUID[] DEFAULT '{}' -- Array of user IDs who have read the message
);

-- Create message_reads table for tracking read receipts
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING gin(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

-- RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they are participants in
CREATE POLICY conversations_user_select ON conversations
  FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

-- Users can create conversations
CREATE POLICY conversations_user_insert ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update conversations they participate in
CREATE POLICY conversations_user_update ON conversations
  FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in conversations they participate in
CREATE POLICY messages_user_select ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- Users can insert messages in conversations they participate in
CREATE POLICY messages_user_insert ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- Users can update their own messages
CREATE POLICY messages_user_update ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for message_reads
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Users can view read receipts for messages they sent or received
CREATE POLICY message_reads_user_select ON message_reads
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_reads.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- Users can mark messages as read
CREATE POLICY message_reads_user_insert ON message_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to get conversation with latest message
CREATE OR REPLACE FUNCTION get_conversations_with_latest_message(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  participant_ids UUID[],
  subject VARCHAR,
  conversation_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  latest_message_content TEXT,
  latest_message_sender_id UUID,
  latest_message_created_at TIMESTAMP WITH TIME ZONE,
  unread_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.participant_ids,
    c.subject,
    c.conversation_type,
    c.created_at,
    c.updated_at,
    m.content,
    m.sender_id,
    m.created_at,
    COUNT(CASE WHEN NOT (m.read_by @> ARRAY[p_user_id]::uuid[]) AND m.sender_id != p_user_id THEN 1 END)::INT
  FROM conversations c
  LEFT JOIN LATERAL (
    SELECT * FROM messages
    WHERE messages.conversation_id = c.id
    ORDER BY messages.created_at DESC
    LIMIT 1
  ) m ON TRUE
  WHERE p_user_id = ANY(c.participant_ids)
  GROUP BY c.id, c.participant_ids, c.subject, c.conversation_type, c.created_at, c.updated_at, m.content, m.sender_id, m.created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversations_with_latest_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversations_with_latest_message(UUID) TO service_role;

-- Create function to mark all messages as read in conversation
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO message_reads (message_id, user_id)
  SELECT id, p_user_id
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND NOT (read_by @> ARRAY[p_user_id]::uuid[])
  ON CONFLICT (message_id, user_id) DO NOTHING;

  UPDATE messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND NOT (read_by @> ARRAY[p_user_id]::uuid[]);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(UUID, UUID) TO service_role;
