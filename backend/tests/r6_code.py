TEST_DATA = {
    "name": "Round 6 Code",
    "description": "Test Hidden",
    "query": '''
    You are given two strings s and pattern.
    A string x is called almost equal to y if you can change at most one character in x to make it identical to y.
    Return the smallest starting index of a substring in s that is almost equal to pattern. If no such index exists, return -1.

    Write a code to solve the problem. You should generate the code through LLM and run it and get the answer as response and return this answer as the API response.
    Then, also push the code in a folder names ROUND_6 to the repo STRICTLY provided by the HACKRX TEAM.

    THIS ENTIRE CHALLENGE TO BE DONE BY LLM ONLY. NO HUMAN INTERVENTION ALLOWED. THIS INCLUDES GENERATION OF CODE, RUNNING IT AND PUSHING TO GITHUB REPO, TO THE SAME REPO PROVIDED BY THE HACKRX TEAM.
    ''',
    "questions": ["The value of s is abcdefg and pattern is bcdffg", "The value of s is ababbababa and pattern is bacaba"],
    "k": 10,
    "delete_after": True
}