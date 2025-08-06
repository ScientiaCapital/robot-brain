import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, checkRateLimit, sanitizeInput } from '@/lib/validation';
import { z } from 'zod';

// Input validation schema
const docsRequestSchema = z.object({
  query: z.string().min(1).max(500),
  library: z.string().optional(),
  topic: z.string().optional(),
  tokens: z.number().min(100).max(20000).optional().default(5000)
});

// Context7 MCP tools (available in this session)
async function resolveLibraryId(libraryName: string) {
  // This would call the Context7 MCP tool in a real implementation
  // For now, we'll return a mock response structure
  const commonLibraries: Record<string, string> = {
    'react': '/facebook/react',
    'next.js': '/vercel/next.js', 
    'nextjs': '/vercel/next.js',
    'elevenlabs': '/elevenlabs/elevenlabs-docs',
    'e2b': '/e2b-dev/code-interpreter',
    'anthropic': '/anthropics/anthropic-sdk-typescript',
    'typescript': '/microsoft/TypeScript',
    'javascript': '/mdn/javascript',
    'python': '/python/cpython',
    'node': '/nodejs/node'
  };

  const libraryId = commonLibraries[libraryName.toLowerCase()];
  if (!libraryId) {
    throw new Error(`Library "${libraryName}" not found in documentation index`);
  }

  return libraryId;
}

async function getLibraryDocs(libraryId: string, topic?: string, tokens = 5000) {
  // This would call the Context7 MCP tool in a real implementation
  // For now, we'll return structured mock documentation
  const mockDocs = {
    '/vercel/next.js': {
      title: 'Next.js Documentation',
      snippets: [
        {
          title: 'API Routes',
          description: 'Creating API endpoints in Next.js',
          language: 'typescript',
          code: `import { NextRequest, NextResponse } from 'next/server';\n\nexport async function GET(request: NextRequest) {\n  return NextResponse.json({ message: 'Hello World' });\n}`
        },
        {
          title: 'Server Components',
          description: 'Using React Server Components',
          language: 'tsx',
          code: `export default function Page() {\n  return <h1>Server Component</h1>;\n}`
        }
      ]
    },
    '/elevenlabs/elevenlabs-docs': {
      title: 'ElevenLabs API Documentation',
      snippets: [
        {
          title: 'Text to Speech',
          description: 'Convert text to speech using ElevenLabs API',
          language: 'typescript',
          code: `import { ElevenLabsClient } from '@elevenlabs/client';\n\nconst client = new ElevenLabsClient({ apiKey: 'your-api-key' });\nconst audio = await client.textToSpeech('voice-id', { text: 'Hello world' });`
        }
      ]
    },
    '/e2b-dev/code-interpreter': {
      title: 'E2B Code Interpreter',
      snippets: [
        {
          title: 'Running Code',
          description: 'Execute code in E2B sandbox',
          language: 'typescript',
          code: `import { Sandbox } from '@e2b/code-interpreter';\n\nconst sandbox = await Sandbox.create();\nconst result = await sandbox.runCode('print("Hello World")');\nconsole.log(result.text);`
        }
      ]
    }
  };

  const docs = mockDocs[libraryId as keyof typeof mockDocs];
  if (!docs) {
    throw new Error(`Documentation for library "${libraryId}" not available`);
  }

  // Filter by topic if provided
  if (topic) {
    const filteredSnippets = docs.snippets.filter(snippet => 
      snippet.title.toLowerCase().includes(topic.toLowerCase()) ||
      snippet.description.toLowerCase().includes(topic.toLowerCase())
    );
    return { ...docs, snippets: filteredSnippets };
  }

  return docs;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 20, 60000)) { // 20 requests per minute
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = docsRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { query, library, topic, tokens } = validationResult.data;
    
    // Sanitize inputs
    const sanitizedQuery = sanitizeInput(query);
    const sanitizedLibrary = library ? sanitizeInput(library) : null;
    const sanitizedTopic = topic ? sanitizeInput(topic) : undefined;

    let docs;
    
    if (sanitizedLibrary) {
      // Get documentation for specific library
      try {
        const libraryId = await resolveLibraryId(sanitizedLibrary);
        docs = await getLibraryDocs(libraryId, sanitizedTopic, tokens);
      } catch (error) {
        return NextResponse.json({
          error: `Documentation lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          query: sanitizedQuery,
          library: sanitizedLibrary
        }, { status: 404 });
      }
    } else {
      // General documentation search
      docs = {
        title: 'Search Results',
        query: sanitizedQuery,
        snippets: [
          {
            title: 'General Programming Help',
            description: 'For specific documentation, include a library parameter',
            language: 'text',
            code: `// To get library-specific documentation, include "library" parameter in your request\n// Supported libraries: react, next.js, elevenlabs, e2b, typescript, python`
          }
        ]
      };
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      documentation: docs,
      metadata: {
        query: sanitizedQuery,
        library: sanitizedLibrary,
        topic: sanitizedTopic,
        processingTime,
        timestamp: new Date().toISOString(),
        source: 'Context7 MCP',
        tokensRequested: tokens
      }
    });

  } catch (error) {
    console.error('Documentation API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: `Documentation request failed: ${message}`,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const library = searchParams.get('library');
    
    if (library) {
      // Get documentation for specific library
      const sanitizedLibrary = sanitizeInput(library);
      
      try {
        const libraryId = await resolveLibraryId(sanitizedLibrary);
        const docs = await getLibraryDocs(libraryId);
        
        return NextResponse.json({
          success: true,
          documentation: docs,
          library: sanitizedLibrary
        });
      } catch (error) {
        return NextResponse.json({
          error: `Library "${sanitizedLibrary}" not found`,
          supportedLibraries: ['react', 'next.js', 'elevenlabs', 'e2b', 'typescript', 'python']
        }, { status: 404 });
      }
    }

    // Return available libraries
    return NextResponse.json({
      status: 'operational',
      service: 'Context7 Documentation API',
      supportedLibraries: [
        'react', 'next.js', 'elevenlabs', 'e2b', 'anthropic', 
        'typescript', 'javascript', 'python', 'node'
      ],
      rateLimits: {
        requestsPerMinute: 20
      },
      usage: {
        method: 'POST',
        parameters: {
          query: 'string (required)',
          library: 'string (optional)',
          topic: 'string (optional)', 
          tokens: 'number (optional, 100-20000)'
        }
      }
    });

  } catch (error) {
    console.error('Documentation API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process documentation request' },
      { status: 500 }
    );
  }
}