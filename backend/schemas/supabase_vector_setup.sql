
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    metadata JSONB,
    embedding VECTOR(1536)
);

CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS documents_metadata_idx ON documents USING GIN (metadata);

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(1536),
    filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
    RETURN query
    SELECT
        id,
        content,
        metadata,
        1 - (documents.embedding <=> query_embedding) AS similarity
    FROM documents
    WHERE metadata @> filter
    ORDER BY documents.embedding <=> query_embedding;
END;
$$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

CREATE OR REPLACE FUNCTION get_document_count(filter JSONB DEFAULT '{}')
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    doc_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doc_count
    FROM documents
    WHERE metadata @> filter;
    
    RETURN doc_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_document_count TO authenticated;

CREATE OR REPLACE FUNCTION delete_documents(filter JSONB DEFAULT '{}')
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM documents
    WHERE metadata @> filter;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_documents TO authenticated;
