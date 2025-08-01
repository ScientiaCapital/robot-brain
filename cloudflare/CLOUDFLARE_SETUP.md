# Cloudflare Integration Setup

This document outlines the setup for Cloudflare D1, KV, and Vectorize for the Robot Brain project.

## Overview

We're integrating three Cloudflare services:

1. **D1 (Database)** - For storing robot conversations and chat history
2. **KV (Key-Value Store)** - For robot memory and session state
3. **Vectorize** - For RAG (Retrieval-Augmented Generation) and robot knowledge

## D1 Database Setup

### 1. Create Database

```bash
wrangler d1 create robot-brain-db
```

### 2. Database Schema

```sql
-- conversations table
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    robot_personality TEXT NOT NULL,
    user_message TEXT NOT NULL,
    robot_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    metadata TEXT -- JSON field for additional data
);

-- robot_interactions table (for multi-robot chats)
CREATE TABLE robot_interactions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    interaction_type TEXT NOT NULL,
    participants TEXT NOT NULL, -- JSON array of robot names
    responses TEXT NOT NULL, -- JSON array of responses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- tool_usage table
CREATE TABLE tool_usage (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    robot_personality TEXT,
    input_params TEXT NOT NULL, -- JSON
    output_result TEXT NOT NULL, -- JSON
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_robot ON conversations(robot_personality);
CREATE INDEX idx_conversations_created ON conversations(created_at);
CREATE INDEX idx_tool_usage_tool ON tool_usage(tool_name);
```

### 3. Wrangler Configuration

Update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "robot-brain-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

## KV Namespace Setup

### 1. Create KV Namespace

```bash
# Production namespace
wrangler kv:namespace create "ROBOT_MEMORY"

# Preview namespace (for testing)
wrangler kv:namespace create "ROBOT_MEMORY" --preview
```

### 2. KV Structure

```javascript
// Session data
await env.ROBOT_MEMORY.put(
  `session:${sessionId}`,
  JSON.stringify({
    userId: "user123",
    startTime: new Date().toISOString(),
    robots: ["friend", "nerd"],
    context: {}
  }),
  { expirationTtl: 3600 } // 1 hour TTL
);

// Robot state
await env.ROBOT_MEMORY.put(
  `robot:${robotName}:state`,
  JSON.stringify({
    lastActive: new Date().toISOString(),
    mood: "happy",
    memoryContext: []
  })
);

// User preferences
await env.ROBOT_MEMORY.put(
  `user:${userId}:prefs`,
  JSON.stringify({
    favoriteRobot: "zen",
    theme: "dark",
    toolsEnabled: ["email", "scraping"]
  })
);
```

### 3. Wrangler Configuration

```toml
[[kv_namespaces]]
binding = "ROBOT_MEMORY"
id = "YOUR_KV_NAMESPACE_ID"

[[kv_namespaces]]
binding = "ROBOT_MEMORY"
id = "YOUR_PREVIEW_KV_ID"
preview_id = "YOUR_PREVIEW_KV_ID"
```

## Vectorize Setup

### 1. Create Vectorize Index

```bash
wrangler vectorize create robot-knowledge \
  --dimensions 768 \
  --metric cosine
```

### 2. Index Structure

```javascript
// Example: Indexing robot knowledge
const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
  text: "Robots can help with email automation"
});

await env.VECTORIZE.upsert([
  {
    id: "knowledge_001",
    values: embedding.data[0],
    metadata: {
      type: "capability",
      robot: "all",
      category: "tools",
      content: "Robots can help with email automation"
    }
  }
]);
```

### 3. RAG Implementation

```javascript
// Search for relevant knowledge
async function searchKnowledge(query, env) {
  // Generate embedding for query
  const queryEmbedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: query
  });
  
  // Search vectorize
  const results = await env.VECTORIZE.query(
    queryEmbedding.data[0],
    { topK: 5 }
  );
  
  // Retrieve full content from metadata
  return results.matches.map(match => ({
    score: match.score,
    content: match.metadata.content,
    category: match.metadata.category
  }));
}
```

### 4. Wrangler Configuration

```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "robot-knowledge"
```

## Analytics Engine Setup (Optional)

Track usage metrics:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

## Environment Variables

Add to `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
ENABLE_TOOLS = "true"
ENABLE_RAG = "true"
```

## Deployment

```bash
# Deploy with all bindings
cd cloudflare
wrangler deploy

# Test locally
wrangler dev
```

## Testing

Create test scripts for each service:

```javascript
// test-d1.js
export async function testD1(env) {
  // Insert test conversation
  const result = await env.DB.prepare(
    "INSERT INTO conversations (id, robot_personality, user_message, robot_response) VALUES (?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    "friend",
    "Hello!",
    "Hey there! So happy to chat!"
  ).run();
  
  return result;
}

// test-kv.js
export async function testKV(env) {
  await env.ROBOT_MEMORY.put("test:key", "test value");
  const value = await env.ROBOT_MEMORY.get("test:key");
  return { stored: "test value", retrieved: value };
}

// test-vectorize.js
export async function testVectorize(env) {
  const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: "Test embedding"
  });
  
  await env.VECTORIZE.upsert([{
    id: "test_001",
    values: embedding.data[0],
    metadata: { content: "Test content" }
  }]);
  
  return { success: true };
}
```