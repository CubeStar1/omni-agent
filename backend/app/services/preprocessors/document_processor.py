from app.services.vector_stores.base_vector_store import BaseVectorStore
from app.services.preprocessors.file_processor import FileProcessor
import uuid
from typing import Dict, Optional

class DocumentProcessor:
    def __init__(self, vector_store: BaseVectorStore, chunk_size: int = 1000, chunk_overlap: int = 200, 
                 clean_content: bool = True, min_chunk_length: int = 100, batch_size: int = 2000,
                 use_llm_pdf_loader: bool = True):
        self.vector_store = vector_store
        self.batch_size = batch_size
        self.file_processor = FileProcessor(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            clean_content=clean_content,
            min_chunk_length=min_chunk_length,
            use_llm_pdf_loader=use_llm_pdf_loader
        )
    
    async def _store_chunks_in_batches(
        self, 
        texts: list, 
        metadatas: list, 
        batch_size: int = 2000
    ) -> list:
        """Store chunks in batches to avoid overwhelming the vector database"""
        all_ids = []
        total_chunks = len(texts)
        
        print(f"Processing {total_chunks} chunks in batches of {batch_size}...")
        
        for i in range(0, total_chunks, batch_size):
            batch_start = i
            batch_end = min(i + batch_size, total_chunks)
            batch_texts = texts[batch_start:batch_end]
            batch_metadatas = metadatas[batch_start:batch_end]
            
            batch_num = (i // batch_size) + 1
            total_batches = (total_chunks + batch_size - 1) // batch_size
            
            print(f"Processing batch {batch_num}/{total_batches} ({len(batch_texts)} chunks)")
            
            try:
                if hasattr(self.vector_store, 'aadd_documents'):
                    batch_ids = await self.vector_store.aadd_documents(
                        texts=batch_texts, 
                        metadatas=batch_metadatas
                    )
                else:
                    batch_ids = self.vector_store.add_documents(
                        texts=batch_texts, 
                        metadatas=batch_metadatas
                    )
                
                all_ids.extend(batch_ids)
                print(f"Batch {batch_num}/{total_batches} completed successfully ({len(batch_ids)} chunks stored)")
                
            except Exception as e:
                print(f"Error processing batch {batch_num}/{total_batches}: {str(e)}")
                raise e
        
        print(f"All batches completed! Total chunks stored: {len(all_ids)}")
        return all_ids
    
    async def process_document_url(
        self, 
        document_url: str, 
        document_id: Optional[str] = None,
        namespace: Optional[str] = None
    ) -> Dict:
        """Process document from URL and store in vector DB"""
        
        if not document_id:
            document_id = str(uuid.uuid4())
        
        try:
            validation_result = self.file_processor.validate_file_url(document_url)
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "error": validation_result["error"],
                    "document_id": document_id
                }
            
            download_result = self.file_processor.download_and_validate_file(document_url)
            if not download_result["success"]:
                return {
                    "success": False,
                    "error": download_result["error"],
                    "document_id": document_id
                }
            
            document_path = download_result["file_path"]
            detected_type = download_result["detected_type"]
            
            load_result = self.file_processor.load_document(document_path, detected_type)
            if not load_result["success"]:
                self.file_processor.cleanup_file(document_path)
                return {
                    "success": False,
                    "error": load_result["error"],
                    "document_id": document_id
                }
            
            documents = load_result["documents"]
            
            chunk_result = self.file_processor.process_to_chunks(documents, detected_type)
            if not chunk_result["success"]:
                self.file_processor.cleanup_file(document_path)
                return {
                    "success": False,
                    "error": chunk_result["error"],
                    "document_id": document_id
                }
            
            chunks = chunk_result["chunks"]
            
            texts = [chunk.page_content for chunk in chunks]
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                metadata = {
                    "document_id": document_id,
                    "page": chunk.metadata.get("page", 0),
                    "source": document_url,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content_cleaned": self.file_processor.clean_content
                }
                
                # if chunk.metadata.get('extraction_method'):
                #     metadata['extraction_method'] = chunk.metadata['extraction_method']
                
                if self.vector_store.store_type == "pinecone" and namespace:
                    metadata["namespace"] = namespace
                    
                metadatas.append(metadata)
            
            print(f"Storing {len(chunks)} chunks in vector database...")
            
            ids = await self._store_chunks_in_batches(texts, metadatas, self.batch_size)
            
            # print(f"Final verification: Testing document retrieval...")
            # try:
            #     verification_results = self.vector_store.similarity_search(
            #         query=texts[0][:100] if texts else "test",
            #         k=2,
            #         filter={"document_id": document_id}
            #     )
            #     if verification_results:
            #         print(f"Final verification successful: {len(verification_results)} documents retrievable")
            #     else:
            #         print("Final verification warning: No documents found in verification search")
            # except Exception as e:
            #     print(f"Final verification error: {e}")
            
            self.file_processor.cleanup_file(document_path)
            
            return {
                "success": True,
                "document_id": document_id,
                "chunks_processed": len(chunks),
                "vector_ids": ids,
                "vector_store": self.vector_store.store_type,
                "extraction_method": chunk_result.get("extraction_method"),
                "patterns_detected": chunk_result.get("patterns_detected", 0)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "document_id": document_id
            }
