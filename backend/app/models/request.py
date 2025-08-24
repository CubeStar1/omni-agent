from pydantic import BaseModel
from typing import List, Optional

class HackRXRequest(BaseModel):
    documents: str 
    questions: List[str]
    k: Optional[int] = 10 
    use_agent: Optional[bool] = True
