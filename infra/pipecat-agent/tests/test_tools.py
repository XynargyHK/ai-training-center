"""
Test infrastructure — automated regression tests for tools.
Run: python tests/test_tools.py
"""
import asyncio
import sys
sys.path.insert(0, '.')


async def test_all():
    results = []

    # Test 1: All tool imports
    try:
        from tools import get_schemas
        schemas = get_schemas(include_vision=True)
        assert len(schemas) >= 12, f"Expected 12+ tools, got {len(schemas)}"
        results.append(("Tool imports", "PASS", f"{len(schemas)} tools"))
    except Exception as e:
        results.append(("Tool imports", "FAIL", str(e)))

    # Test 2: Config voices
    try:
        from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE
        assert len(LANGUAGE_VOICES) >= 9
        assert "cantonese" in LANGUAGE_VOICES
        assert "vietnamese" in LANGUAGE_VOICES
        results.append(("Config voices", "PASS", f"{len(LANGUAGE_VOICES)} voices"))
    except Exception as e:
        results.append(("Config voices", "FAIL", str(e)))

    # Test 3: bot.py syntax
    try:
        import py_compile
        py_compile.compile('bot.py', doraise=True)
        results.append(("bot.py syntax", "PASS", ""))
    except Exception as e:
        results.append(("bot.py syntax", "FAIL", str(e)))

    # Test 4: Parts imports
    try:
        from parts.voice_swap import swap_tts_voice
        from parts.reasoning_logger import ReasoningLogger
        from parts.session_logger import log_session
        from parts.cost_tracker import CostTracker
        from parts.fallback import call_brain
        results.append(("Parts imports", "PASS", "5 parts"))
    except Exception as e:
        results.append(("Parts imports", "FAIL", str(e)))

    # Test 5: Tool schema validation
    try:
        from tools import get_schemas
        for schema in get_schemas():
            assert schema.name, "Tool has no name"
            assert schema.description, f"Tool {schema.name} has no description"
        results.append(("Schema validation", "PASS", "all have name+description"))
    except Exception as e:
        results.append(("Schema validation", "FAIL", str(e)))

    # Print results
    print("\n" + "=" * 50)
    print("PIPECAT AGENT TEST RESULTS")
    print("=" * 50)
    passed = 0
    failed = 0
    for name, status, detail in results:
        icon = "OK" if status == "PASS" else "XX"
        print(f"  {icon} {name}: {status} {detail}")
        if status == "PASS":
            passed += 1
        else:
            failed += 1
    print(f"\n  {passed} passed, {failed} failed")
    print("=" * 50)
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(test_all())
    sys.exit(0 if success else 1)
