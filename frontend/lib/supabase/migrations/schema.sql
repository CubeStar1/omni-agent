CREATE OR REPLACE FUNCTION execute_sql(query text) 
RETURNS jsonb 
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  clean_query text := rtrim(query, ';');
BEGIN
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || clean_query || ') t' INTO result;
  RETURN result;
END;
$$;

create table if not exists agent_config (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  model          text        not null default 'gpt-4o-mini',
  system_prompt  text        default '',
  enabled_tools  text[]      not null default '{}',
  updated_at     timestamptz not null default now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create table public.conversations (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  title text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint conversations_pkey primary key (id),
  constraint conversations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_conversations_updated_at BEFORE
update on conversations for EACH row
execute FUNCTION update_updated_at ();

create table public.messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  conversation_id uuid null,
  role text not null,
  content text not null,
  tool_invocations jsonb null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS hackrx_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    document_url TEXT NOT NULL,
    questions JSONB NOT NULL,
    answers JSONB NOT NULL,
    processing_time FLOAT NOT NULL,
    document_metadata JSONB NOT NULL,
    raw_response JSONB NOT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    questions_count INTEGER,
    chunks_processed INTEGER,
    vector_store TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackrx_requests_timestamp ON hackrx_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_hackrx_requests_success ON hackrx_requests(success);
CREATE INDEX IF NOT EXISTS idx_hackrx_requests_vector_store ON hackrx_requests(vector_store);