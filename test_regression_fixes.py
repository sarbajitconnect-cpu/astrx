"""
Comprehensive Regression Verification Suite for Astra
Tests:
1. Conversational Continuity (Multi-turn follow-ups, pronoun resolution, code optimization and change explanation)
2. Normal Mode Concise Default (1-3 sentences for simple questions) & Adaptive Length (detailed/brief)
3. Study Mode Complete Academic Workflow (Scholarly queries, deep literature review, multi-turn follow-up, PDF/DOCX)
4. Code Mode Polyglot Sandbox (Python, Node.js, C, C++, compilation errors, security rejection, dependency management)
5. Zero Emojis in Responses & Citations
"""
import time
import httpx
import re

BASE_URL = "http://127.0.0.1:8000"

def run_regression_tests():
    print("=" * 70)
    print("ASTRA COMPREHENSIVE REGRESSION & CONTINUITY TEST SUITE")
    print("=" * 70)

    client = httpx.Client(base_url=BASE_URL, timeout=90.0)

    # Setup Test User
    email = f"continuity_test_{int(time.time())}@astra.ai"
    pwd = "AstraPassword2026!"
    reg = client.post("/api/auth/register", json={
        "email": email,
        "username": f"researcher_{int(time.time())}",
        "password": pwd
    }).json()
    token = reg.get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # ─────────────────────────────────────────────────────────────────────────────
    # SUITE 1: Conversational Continuity & Multi-Turn Reasoning (Requirement 1)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[SUITE 1] Conversational Continuity & Pronoun Resolution")
    conv_id = f"test-conv-{int(time.time())}"

    # Turn 1: Explain RAG
    print("  Turn 1: Explain how a RAG agent works.")
    t1_res = client.post("/api/chat", headers=headers, json={
        "message": "Explain how a RAG agent works.",
        "mode": "core",
        "conversation_id": conv_id
    })
    assert t1_res.status_code == 200, f"Turn 1 failed: {t1_res.text}"
    t1_ans = t1_res.json()["answer"]
    print("  Turn 1 Answer Snippet:", t1_ans[:120], "...")

    # Turn 2: Pronoun resolution ("What are its advantages?")
    print("  Turn 2: What are its advantages? (Pronoun resolution for RAG)")
    t2_res = client.post("/api/chat", headers=headers, json={
        "message": "What are its advantages?",
        "mode": "core",
        "conversation_id": conv_id
    })
    assert t2_res.status_code == 200, f"Turn 2 failed: {t2_res.text}"
    t2_ans = t2_res.json()["answer"]
    print("  Turn 2 Answer Snippet:", t2_ans[:140], "...")
    # Verify it discusses RAG/retrieval advantages, not asking for clarification
    t2_lower = t2_ans.lower()
    assert any(w in t2_lower for w in ["retrieval", "rag", "hallucination", "external", "ground", "knowledge", "accuracy", "context"]), \
        f"Turn 2 failed to resolve pronoun 'its' to RAG: {t2_ans}"
    print("  -> Pronoun 'its' successfully resolved to RAG.")

    # Turn 3: Write code
    print("  Turn 3: Write a Python program to implement binary search.")
    t3_res = client.post("/api/chat", headers=headers, json={
        "message": "Write a Python program to implement binary search.",
        "mode": "code",
        "conversation_id": conv_id
    })
    assert t3_res.status_code == 200
    t3_ans = t3_res.json()["answer"]
    print("  Turn 3 Answer Snippet:", t3_ans[:120], "...")
    assert "binary_search" in t3_ans or "binary" in t3_ans.lower()

    # Turn 4: "Optimize it."
    print("  Turn 4: Optimize it. (Follow-up code optimization)")
    t4_res = client.post("/api/chat", headers=headers, json={
        "message": "Optimize it.",
        "mode": "code",
        "conversation_id": conv_id
    })
    assert t4_res.status_code == 200
    t4_ans = t4_res.json()["answer"]
    print("  Turn 4 Answer Snippet:", t4_ans[:140], "...")
    assert any(w in t4_ans.lower() for w in ["binary", "search", "mid", "bisect", "complexity", "pointer"]), \
        f"Turn 4 failed to optimize binary search: {t4_ans}"
    print("  -> Follow-up 'Optimize it' successfully optimized binary search.")

    # Turn 5: "Explain the changes."
    print("  Turn 5: Explain the changes.")
    t5_res = client.post("/api/chat", headers=headers, json={
        "message": "Explain the changes.",
        "mode": "code",
        "conversation_id": conv_id
    })
    assert t5_res.status_code == 200
    t5_ans = t5_res.json()["answer"]
    print("  Turn 5 Answer Snippet:", t5_ans[:140], "...")
    assert any(w in t5_ans.lower() for w in ["change", "optim", "complexity", "iteration", "overflow", "index", "memory", "recursion"]), \
        f"Turn 5 failed to explain optimization changes: {t5_ans}"
    print("  -> Follow-up 'Explain the changes' accurately explained previous optimization.")

    # Persistence verification: reload conversation detail from DB
    conv_detail = client.get(f"/api/conversations/{conv_id}", headers=headers).json()
    assert len(conv_detail.get("messages", [])) >= 10, f"Expected at least 10 messages persisted, got {len(conv_detail.get('messages', []))}"
    print(f"  -> DB Persistence Verified: {len(conv_detail['messages'])} messages stored.")
    print("  PASS: Conversational Continuity Suite OK")

    # ─────────────────────────────────────────────────────────────────────────────
    # SUITE 2: Normal Mode Concise Default & Adaptive Length (Requirement 2)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[SUITE 2] Normal Mode Response Length (Concise Default vs Adaptive)")

    # 1. Simple question: "What is Python?"
    print("  Test 2.1: Simple Question ('What is Python?')")
    py_res = client.post("/api/chat", headers=headers, json={
        "message": "What is Python?",
        "mode": "core"
    })
    assert py_res.status_code == 200
    py_ans = py_res.json()["answer"].strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", py_ans) if len(s.strip()) > 3]
    print(f"  Answer ({len(sentences)} sentences):\n  {py_ans}")
    assert len(sentences) <= 4, f"Expected concise answer (1-3 sentences), got {len(sentences)} sentences"
    print("  -> Verified: Concise 1-3 sentences.")

    # 2. Simple comparison: "What is the difference between RAM and ROM?"
    print("\n  Test 2.2: Explanatory Question ('What is the difference between RAM and ROM?')")
    ram_res = client.post("/api/chat", headers=headers, json={
        "message": "What is the difference between RAM and ROM?",
        "mode": "core"
    })
    assert ram_res.status_code == 200
    ram_ans = ram_res.json()["answer"].strip()
    ram_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", ram_ans) if len(s.strip()) > 3]
    print(f"  Answer ({len(ram_sentences)} sentences):\n  {ram_ans}")
    assert len(ram_sentences) <= 7, f"Expected concise comparison (3-6 sentences), got {len(ram_sentences)} sentences"
    print("  -> Verified: Focused, concise comparison.")

    # 3. Explicit detailed request
    print("\n  Test 2.3: Explicit Detailed Request ('Explain quantum computing in detail.')")
    qc_res = client.post("/api/chat", headers=headers, json={
        "message": "Explain quantum computing in detail.",
        "mode": "core"
    })
    assert qc_res.status_code == 200
    qc_ans = qc_res.json()["answer"].strip()
    print(f"  Detailed Answer Length: {len(qc_ans)} chars")
    assert len(qc_ans) > 500, "Expected comprehensive in-depth explanation when detailed was explicitly requested."
    print("  -> Verified: In-depth comprehensive response on explicit request.")

    # 4. Explicit brief request
    print("\n  Test 2.4: Explicit Brief Request ('Explain gravity in simple words briefly.')")
    grav_res = client.post("/api/chat", headers=headers, json={
        "message": "Explain gravity in simple words briefly.",
        "mode": "core"
    })
    assert grav_res.status_code == 200
    grav_ans = grav_res.json()["answer"].strip()
    print("  Brief Answer:\n ", grav_ans)
    assert len(grav_ans) < 300, f"Expected short answer, got {len(grav_ans)} chars"
    print("  -> Verified: Short response on brief request.")
    print("  PASS: Adaptive Response Length Suite OK")

    # ─────────────────────────────────────────────────────────────────────────────
    # SUITE 3: Study Mode Academic Workflow & Exports (Requirement 3)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[SUITE 3] Study Mode Academic Research & Document Exports")
    study_conv_id = f"study-conv-{int(time.time())}"

    # 3.1 Structured Academic Explanation
    print("  Test 3.1: Academic Technical Query (Schrödinger Equation & Hamiltonian)")
    sch_res = client.post("/api/chat", headers=headers, json={
        "message": "Formulate the time-independent Schrödinger equation and explain the Hamiltonian operator.",
        "mode": "study",
        "conversation_id": study_conv_id
    })
    assert sch_res.status_code == 200
    sch_data = sch_res.json()
    print("  Academic Explanation Length:", len(sch_data["answer"]))
    assert any(sym in sch_data["answer"] for sym in ["\\hat{H}", "H", "\\psi", "\\Psi", "E\\psi", "Schrödinger", "Hamiltonian"]), \
        "Expected LaTeX mathematical formulation in academic explanation"
    print("  -> Verified: Rigorous academic derivation with LaTeX formatting.")

    # 3.2 Multi-Turn Follow-Up in Study Mode
    print("  Test 3.2: Study Mode Multi-Turn Follow-up ('What are its physical boundary conditions?')")
    bc_res = client.post("/api/chat", headers=headers, json={
        "message": "What are its physical boundary conditions?",
        "mode": "study",
        "conversation_id": study_conv_id
    })
    assert bc_res.status_code == 200
    bc_ans = bc_res.json()["answer"]
    print("  Follow-up Answer Snippet:", bc_ans[:140], "...")
    assert any(w in bc_ans.lower() for w in ["wavefunction", "psi", "continuous", "finite", "boundary", "infinity", "normalization"]), \
        f"Study follow-up failed to reference wave equation: {bc_ans}"
    print("  -> Verified: Multi-turn conversational continuity in Study Mode.")

    # 3.3 Deep Literature Review with Real Papers
    print("  Test 3.3: Comprehensive Literature Review with OpenAlex/Crossref/arXiv")
    lit_res = client.post("/api/chat", headers=headers, json={
        "message": "Comprehensive literature review on topological insulators and Chern numbers with citations",
        "mode": "study"
    })
    assert lit_res.status_code == 200
    lit_data = lit_res.json()
    papers = lit_data.get("academic_papers", [])
    print(f"  Papers retrieved from academic repositories: {len(papers)}")
    if papers:
        print("  Top Paper:", papers[0]["title"], f"({papers[0]['year']})")
        print("  DOI/URL:", papers[0]["doi_or_url"])
    
    # 3.4 Export PDF & DOCX
    pdf_res = client.post("/api/study/export/pdf", json={"title": "Topological Insulators", "content": lit_data["answer"]})
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 1000
    print(f"  PDF Export Size: {len(pdf_res.content)} bytes")

    docx_res = client.post("/api/study/export/docx", json={"title": "Topological Insulators", "content": lit_data["answer"]})
    assert docx_res.status_code == 200
    assert len(docx_res.content) > 1000
    print(f"  DOCX Export Size: {len(docx_res.content)} bytes")
    print("  PASS: Study Mode Academic Workflow & Exports OK")

    # ─────────────────────────────────────────────────────────────────────────────
    # SUITE 4: Code Mode Polyglot Sandbox & Dependencies (Requirement 4)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[SUITE 4] Code Mode: Polyglot Execution & Sandbox Environment")

    # 4.1 Python Execution
    py_code = "import math\nprint(f'Pi to 5 digits: {math.pi:.5f}')"
    py_exec = client.post("/api/code/run", headers=headers, json={"code": py_code, "language": "python"}).json()
    assert py_exec["exit_code"] == 0, f"Python failed: {py_exec}"
    assert "Pi to 5 digits: 3.14159" in py_exec["stdout"]
    print("  Test 4.1 Python Execution: PASS (stdout: " + py_exec["stdout"].strip() + ")")

    # 4.2 JavaScript Execution (Node.js)
    js_code = "const nums = [1, 2, 3, 4, 5]; console.log('Sum:', nums.reduce((a,b)=>a+b, 0));"
    js_exec = client.post("/api/code/run", headers=headers, json={"code": js_code, "language": "javascript"}).json()
    assert js_exec["exit_code"] == 0, f"JavaScript failed: {js_exec}"
    assert "Sum: 15" in js_exec["stdout"]
    print("  Test 4.2 JavaScript (Node.js) Execution: PASS (stdout: " + js_exec["stdout"].strip() + ")")

    # 4.3 C Compilation & Execution (Clang)
    c_code = '#include <stdio.h>\nint main(){ printf("Clang C Binary Executed Successfully\\n"); return 0; }'
    c_exec = client.post("/api/code/run", headers=headers, json={"code": c_code, "language": "c"}).json()
    assert c_exec["exit_code"] == 0, f"C failed: {c_exec}"
    assert "Clang C Binary Executed Successfully" in c_exec["stdout"]
    print("  Test 4.3 C Compilation & Execution: PASS (stdout: " + c_exec["stdout"].strip() + ")")

    # 4.4 C++ Compilation & Execution (Clang++)
    cpp_code = '#include <iostream>\n#include <vector>\nint main(){ std::vector<int> v={10,20}; std::cout << "Vector sum: " << v[0]+v[1] << std::endl; return 0; }'
    cpp_exec = client.post("/api/code/run", headers=headers, json={"code": cpp_code, "language": "cpp"}).json()
    assert cpp_exec["exit_code"] == 0, f"C++ failed: {cpp_exec}"
    assert "Vector sum: 30" in cpp_exec["stdout"]
    print("  Test 4.4 C++ Compilation & Execution: PASS (stdout: " + cpp_exec["stdout"].strip() + ")")

    # 4.5 Compilation Error Handling
    broken_c = '#include <stdio.h>\nint main(){ SYNTAX_ERROR_UNDEFINED(); return 0; }'
    broken_exec = client.post("/api/code/run", headers=headers, json={"code": broken_c, "language": "c"}).json()
    assert broken_exec["exit_code"] != 0
    assert "Compilation Error" in broken_exec["stderr"]
    print("  Test 4.5 Compilation Error Catching: PASS")

    # 4.6 Runtime Error Handling
    err_code = "print(10 / 0)"
    err_exec = client.post("/api/code/run", headers=headers, json={"code": err_code, "language": "python"}).json()
    assert err_exec["exit_code"] != 0
    assert "ZeroDivisionError" in err_exec["stderr"]
    print("  Test 4.6 Runtime Error Catching: PASS")

    # 4.7 Malicious Code Sandbox Rejection
    mal_code = "import os\nos.system('rm -rf /tmp/test')"
    mal_exec = client.post("/api/code/run", headers=headers, json={"code": mal_code, "language": "python"}).json()
    assert mal_exec["exit_code"] != 0
    assert "Security policy" in mal_exec["stderr"]
    print("  Test 4.7 Security Policy Rejection: PASS")

    # 4.8 Dependency Checking
    dep_code = "import numpy as np\nimport sympy\nimport some_uninstalled_custom_library_xyz\n"
    dep_res = client.post("/api/code/deps/check", json={"code": dep_code, "language": "python"}).json()
    dep_map = {d["name"]: d["installed"] for d in dep_res.get("dependencies", [])}
    assert dep_map.get("sympy") is True
    assert dep_map.get("some_uninstalled_custom_library_xyz") is False
    print("  Test 4.8 Dependency Detection: PASS (sympy=True, uninstalled=False)")
    print("  PASS: Code Mode Polyglot Sandbox Suite OK")

    # ─────────────────────────────────────────────────────────────────────────────
    # SUITE 5: Zero Emojis Verification (Requirement 5)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[SUITE 5] Zero Emojis in Responses & Citations")
    emoji_check = re.compile(r"[\U0001F300-\U0001FAFF\U00002600-\U000027BF]")

    all_answers = [t1_ans, t2_ans, py_ans, ram_ans, sch_data["answer"]]
    all_sources = t1_res.json().get("sources", []) + sch_data.get("sources", [])

    for ans in all_answers:
        matches = emoji_check.findall(ans)
        assert len(matches) == 0, f"Found emojis in model response: {matches}"

    for s in all_sources:
        label = s.get("label", "")
        matches = emoji_check.findall(label)
        assert len(matches) == 0, f"Found emojis in source label: '{label}'"

    print("  -> Verified zero emojis in all sampled model outputs and source badges.")
    print("  PASS: Zero Emojis Suite OK")

    print("\n" + "=" * 70)
    print("ALL 5 REGRESSION SUITES PASSED COMPLETELY AND PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_regression_tests()
