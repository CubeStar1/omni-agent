import asyncio
import aiohttp
import json
import os
import importlib.util
from datetime import datetime
from pathlib import Path

async def save_results_to_markdown(result, test_data, test_type="hackrx_api"):    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"results/{test_type}_test_{timestamp}.md"
    
    os.makedirs("results", exist_ok=True)
    
    md_content = f"""# {test_type.upper()} Test Results
    
## Test Information
- **Timestamp**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Test Type**: {test_type}
- **Processing Time**: {result.get('processing_time', 'N/A')} seconds
- **Documents Deleted**: {result.get('deleted_documents', False)}
- **Chunks per Question**: {test_data.get('k', 'N/A')}

## Document Metadata
```json
{json.dumps(result.get('document_metadata', {}), indent=2)}
```

## Questions & Answers with Retrieved Chunks

"""
    
    answers = result.get('answers', [])
    debug_info = result.get('raw_response', {}).get('debug_info', [])
    
    for i, (question, answer) in enumerate(zip(test_data.get('questions', []), answers), 1):
        debug_data = {}
        for debug in debug_info:
            if debug.get('question') == question:
                debug_data = debug
                break
        
        context_docs = debug_data.get('context_documents', [])
        context_with_scores = debug_data.get('context_with_scores', [])
        chunks_count = debug_data.get('chunks_count', 0)
        
        md_content += f"""
### Q{i}: {question}

**Answer**: {answer}

**Retrieved Context** ({chunks_count} chunks):
"""
        
        if context_with_scores:
            for j, chunk_data in enumerate(context_with_scores, 1):
                content = chunk_data.get('content', '')
                score = chunk_data.get('similarity_score', 0)
                preview = content[:500] + "..." if len(content) > 500 else content
                md_content += f"""
{j}. **Similarity Score: {score:.3f}**
   {preview}

"""
        elif context_docs:
            for j, doc_content in enumerate(context_docs, 1):
                preview = doc_content[:500] + "..." if len(doc_content) > 500 else doc_content
                md_content += f"""
{j}. {preview}

"""
        else:
            md_content += "\nNo context documents retrieved.\n"
        
        md_content += "---\n"
    
    md_content += f"""
## Raw API Response
```json
{json.dumps(result, indent=2)}
```
"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"📄 Results saved to: {filename}")
    return filename

async def save_single_query_results(result, query_data):
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"results/single_query_test_{timestamp}.md"
    
    os.makedirs("results", exist_ok=True)
    
    md_content = f"""# Single Query Test Results

## Test Information
- **Timestamp**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Question**: {query_data.get('question', 'N/A')}
- **Document ID**: {query_data.get('document_id', 'N/A')}
- **Chunks Retrieved**: {query_data.get('k', 'N/A')}

## Question & Answer

### Q: {query_data.get('question', 'N/A')}

**Answer**: {result.get('answer', 'N/A')}

**Confidence Score**: {result.get('confidence_score', 0):.2f}%

**Retrieved Context** ({len(result.get('source_chunks', []))} chunks):
"""
    
    for i, chunk in enumerate(result.get('source_chunks', []), 1):
        content = chunk.get('content', 'N/A')
        metadata = chunk.get('metadata', {})
        
        md_content += f"""
{i}. **Metadata**: `{metadata}`
   **Content**: {content}

"""
    
    md_content += f"""
## Raw API Response
```json
{json.dumps(result, indent=2)}
```
"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"📄 Single query results saved to: {filename}")
    return filename

def load_test_data_from_file(file_path):
    spec = importlib.util.spec_from_file_location("test_module", file_path)
    test_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(test_module)
    return test_module.TEST_DATA

def discover_test_files():
    tests_dir = Path("tests")
    test_files = []
    
    if tests_dir.exists():
        for file_path in tests_dir.glob("*.py"):
            if file_path.name == "test_config.py":
                continue
            try:
                test_data = load_test_data_from_file(file_path)
                test_files.append({
                    "file_path": str(file_path),
                    "name": test_data.get("name", file_path.stem),
                    "description": test_data.get("description", "No description available"),
                    "data": test_data
                })
            except Exception as e:
                print(f"⚠️ Error loading {file_path}: {e}")
    
    return test_files

async def run_single_test(session, base_url, headers, test_info):
    test_data = test_info["data"]
    test_name = test_info["name"]
    
    print(f"\n🧪 Running test: {test_name}")
    print(f"📝 Description: {test_info['description']}")
    print(f"❓ Questions: {len(test_data.get('questions', []))}")
    print(f"📊 Chunks per question: {test_data.get('k', 'N/A')}")
    print("=" * 60)
    
    try:
        async with session.post(
            f"{base_url}/hackrx/run",
            headers=headers,
            json=test_data
        ) as response:
            
            print(f"Status Code: {response.status}")
            
            if response.status == 200:
                result = await response.json()
                print(result)
                print("✅ Request successful!")
                print(f"Processing time: {result.get('processing_time', 'N/A')} seconds")
                print(f"Document metadata: {result.get('document_metadata', {})}")
                print(f"Documents deleted: {result.get('deleted_documents', False)}")
                
                file_name = test_info["file_path"].replace("tests\\", "").replace(".py", "")
                await save_results_to_markdown(result, test_data, file_name)
                
                print(f"\n📝 Answers Summary for {test_name}:")
                print("=" * 50)
                
                for i, (question, answer) in enumerate(zip(test_data["questions"], result["answers"]), 1):
                    print(f"\nQ{i}: {question}")
                    print(f"A{i}: {answer}")
                    print("-" * 30)
                
                return True
            else:
                error_text = await response.text()
                print(f"❌ Request failed: {error_text}")
                return False
                
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        return False


async def test_hackrx_api_modular(selected_tests):
    """Run the selected modular tests"""
    # base_url = "https://hackrx-api-illvzn.onrender.com"
    # base_url = " https://liberal-free-dove.ngrok-free.app"
    # base_url = "https://hackrx-backend.yellowsmoke-e9621a2b.centralindia.azurecontainerapps.io"

    base_url = "https://liberal-free-dove.ngrok-free.app/api"
    # base_url = "https://legible-preferably-bird.ngrok-free.app/api"
    headers = {
        "Authorization": "Bearer 78fb5a798235f5f9f659aa6e26fbece2b49413756a8fc4ee51ee190e89232496",
        "Content-Type": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        print("\n🚀 Testing HackRX API...")
        print(f"🌐 URL: {base_url}/hackrx/run")
        print("=" * 70)
        
        try:
            # print("1. Testing health endpoint...")
            # async with session.get(f"{base_url}/hackrx/health") as response:
            #     if response.status == 200:
            #         health_data = await response.json()
            #         print(f"✅ Health check passed: {health_data}")
            #     else:
            #         print(f"❌ Health check failed: {response.status}")
            #         return
            
            successful_tests = 0
            failed_tests = 0
            
            for test_info in selected_tests:
                success = await run_single_test(session, base_url, headers, test_info)
                if success:
                    successful_tests += 1
                else:
                    failed_tests += 1
                
                await asyncio.sleep(1)
            
            print(f"\n📊 Test Results Summary:")
            print("=" * 50)
            print(f"✅ Successful tests: {successful_tests}")
            print(f"❌ Failed tests: {failed_tests}")
            print(f"📄 Detailed results saved to markdown files in results/")
                    
        except Exception as e:
            print(f"❌ Error occurred: {str(e)}")


if __name__ == "__main__":
    print("🔬 HackRX API Test Script")
    print("Make sure the server is running on localhost:8000")
    print("=" * 60)
    
    test_files = discover_test_files()
    
    if not test_files:
        print("❌ No test files found in the tests directory!")
        print("📁 Please make sure you have test files in the 'tests/' folder")
        exit(1)
    
    print("📁 Available test files:")
    print("=" * 50)
    for i, test_info in enumerate(test_files, 1):
        print(f"{i}. {test_info['name']}")
        print(f"   📝 {test_info['description']}")
        print(f"   ❓ Questions: {len(test_info['data'].get('questions', []))}")
        print()
    
    print("Select tests to run:")
    print("- Enter numbers separated by commas (e.g., 1,3,5)")
    print("- Enter 'all' to run all tests")
    print("- Enter 'q' to quit")
    
    selection = input("Your choice: ").strip().lower()
    
    if selection == 'q':
        print("👋 Exiting...")
        exit()
    elif selection == 'all':
        print("Running all tests...")
        asyncio.run(test_hackrx_api_modular(test_files))
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            selected_tests = [test_files[i] for i in indices if 0 <= i < len(test_files)]
            if selected_tests:
                asyncio.run(test_hackrx_api_modular(selected_tests))
            else:
                print("❌ No valid tests selected!")
        except (ValueError, IndexError):
            print("❌ Invalid selection!")