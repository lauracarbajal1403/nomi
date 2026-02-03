import { ChromaClient, Collection, EmbeddingFunction } from 'chromadb';
import { VectorSearchResult, KnowledgeChunk, ChromaCollection } from '../types/knowledge.types';

// Custom embedding function that does nothing (we handle embeddings externally with OpenAI)
class NoOpEmbeddingFunction implements EmbeddingFunction {
  async generate(_texts: string[]): Promise<number[][]> {
    // This should never be called since we provide embeddings manually
    throw new Error('NoOpEmbeddingFunction should not be called - embeddings are provided externally');
  }
}

class VectorService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private readonly collectionName = 'filos_knowledge_v3';
  private readonly noOpEmbedding = new NoOpEmbeddingFunction();

  constructor() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    
    // Parse URL to extract components for modern ChromaClient
    const url = new URL(chromaUrl);
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
    const ssl = url.protocol === 'https:';
    
    this.client = new ChromaClient({
      host: host,
      port: port,
      ssl: ssl
      // ChromaDB client handles API version internally
    });
    
    console.log(`🔗 Connecting to ChromaDB at: ${host}:${port} (ssl: ${ssl})`);
  }

  async initialize(): Promise<void> {
    try {
      // Try to get existing collection first
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
          embeddingFunction: this.noOpEmbedding // Custom no-op embedding function
        });
        console.log(`✅ Connected to existing ChromaDB collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        console.log(`🆕 Creating new ChromaDB collection: ${this.collectionName}`);
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Filos business knowledge base',
            version: '3.0',
            created_at: new Date().toISOString()
          },
          embeddingFunction: this.noOpEmbedding // Custom no-op embedding function
        });
        console.log(`✅ Created ChromaDB collection: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  async addDocuments(chunks: KnowledgeChunk[]): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      const ids = chunks.map(chunk => chunk.id);
      const documents = chunks.map(chunk => chunk.content);
      const embeddings = chunks.map(chunk => chunk.embedding!);
      const metadatas = chunks.map(chunk => ({
        document_id: chunk.metadata.documentId,
        chunk_index: chunk.metadata.chunkIndex,
        category: chunk.metadata.category,
        section: chunk.metadata.section || ''
      }));

      await this.collection.add({
        ids,
        documents,
        embeddings,
        metadatas
      });

      console.log(`✅ Added ${chunks.length} chunks to ChromaDB`);
    } catch (error) {
      console.error('❌ Failed to add documents to ChromaDB:', error);
      throw error;
    }
  }

  async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<VectorSearchResult[]> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      if (!results.documents || !results.documents[0] || !results.metadatas || !results.distances) {
        return [];
      }

      const searchResults: VectorSearchResult[] = [];
      
      for (let i = 0; i < results.documents[0].length; i++) {
        const metadata = results.metadatas[0]?.[i] as Record<string, unknown>;
        const rawDistance = results.distances[0]?.[i] || 1;
        // For Euclidean distance on normalized embeddings, convert to 0-1 similarity
        const similarity = Math.max(0, 2 - rawDistance) / 2;
        
        searchResults.push({
          id: results.ids?.[0]?.[i] || `result_${i}`,
          content: results.documents[0][i] || '',
          score: similarity,
          metadata: {
            documentId: (metadata?.document_id as string) || '',
            chunkIndex: (metadata?.chunk_index as number) || 0,
            category: (metadata?.category as string) || '',
            section: (metadata?.section as string) || undefined
          }
        });
      }

      return searchResults;
    } catch (error) {
      console.error('❌ Failed to search ChromaDB:', error);
      throw error;
    }
  }

  async updateDocument(chunkId: string, chunk: KnowledgeChunk): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      await this.collection.update({
        ids: [chunkId],
        documents: [chunk.content],
        embeddings: [chunk.embedding!],
        metadatas: [{
          document_id: chunk.metadata.documentId,
          chunk_index: chunk.metadata.chunkIndex,
          category: chunk.metadata.category,
          section: chunk.metadata.section || ''
        }]
      });

      console.log(`✅ Updated chunk ${chunkId} in ChromaDB`);
    } catch (error) {
      console.error(`❌ Failed to update chunk ${chunkId}:`, error);
      throw error;
    }
  }

  async deleteDocument(chunkId: string): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      await this.collection.delete({
        ids: [chunkId]
      });

      console.log(`✅ Deleted chunk ${chunkId} from ChromaDB`);
    } catch (error) {
      console.error(`❌ Failed to delete chunk ${chunkId}:`, error);
      throw error;
    }
  }

  async getCollectionInfo(): Promise<ChromaCollection> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      const count = await this.collection.count();
      
      return {
        name: this.collectionName,
        metadata: {
          document_count: count,
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Failed to get collection info:', error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      await this.client.deleteCollection({
        name: this.collectionName
      });

      // Recreate the collection
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Filos business knowledge base',
          version: '3.0',
          created_at: new Date().toISOString()
        },
        embeddingFunction: this.noOpEmbedding // Custom no-op embedding function
      });

      console.log(`✅ Cleared and recreated ChromaDB collection: ${this.collectionName}`);
    } catch (error) {
      console.error('❌ Failed to clear collection:', error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.collection) {
        await this.initialize();
      }
      
      await this.collection!.count();
      return true;
    } catch (error) {
      console.error('❌ ChromaDB health check failed:', error);
      return false;
    }
  }
}

export const vectorService = new VectorService();
