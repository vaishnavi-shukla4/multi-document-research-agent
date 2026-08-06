create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  filename text not null,
  uploaded_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(3072),
  chunk_index int not null,
  page_number int
);

create index chunks_embedding_idx on chunks
  using hnsw (embedding vector_cosine_ops);

create index chunks_document_id_idx on chunks (document_id);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  title text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  source_chunk_ids uuid[],
  created_at timestamptz default now()
);

create index messages_conversation_id_idx on messages (conversation_id, created_at);