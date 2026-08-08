"""
copilot.py — AI-grounded diagnosis for a specific router.

GROUNDING RULES (never deviate):
1. Pull router's actual computed stats FIRST in Python code.
2. Pass those real numbers as structured context to the LLM.
3. Instruct the model explicitly: only use provided numbers, cite them, recommend exactly ONE fix.
4. If no LLM API is configured, fall back to a deterministic rule-based decision tree
   over the same stats — grounding requirement matters more than generativeness.

Fix options: "firmware update" | "relocate router" | "replace router" | "user education"
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

HEALTHY_THRESHOLD = 70.0  # score above this → router is healthy
FIX_OPTIONS = ["firmware update", "relocate router", "replace router", "user education"]


def _rule_based_diagnosis(router_stats: dict, fleet_stats: dict, complaint_texts: list[str]) -> dict:
    """
    Deterministic fallback when no LLM API is available.
    Decision tree over real stats only — no invented data.
    """
    score = router_stats["score"]
    avg_packet_loss = router_stats["avg_packet_loss"]
    avg_signal = router_stats["avg_signal"]
    avg_disconnects = router_stats["avg_disconnects"]
    avg_latency = router_stats["avg_latency"]
    avg_speed = router_stats["avg_speed"]
    has_complaints = len(complaint_texts) > 0

    # Fleet context
    fleet_avg_speed = fleet_stats["fleet_avg_speed"]
    fleet_avg_latency = fleet_stats["fleet_avg_latency"]
    fleet_avg_packet_loss = fleet_stats["fleet_avg_packet_loss"]
    fleet_avg_disconnects = fleet_stats["fleet_avg_disconnects"]
    fleet_p75_packet_loss = fleet_stats["fleet_p75_packet_loss"]
    fleet_p25_signal = fleet_stats["fleet_p25_signal"]
    fleet_p75_disconnects = fleet_stats["fleet_p75_disconnects"]

    cited_numbers = {
        "avg_speed_mbps": avg_speed,
        "avg_latency_ms": avg_latency,
        "avg_packet_loss_pct": avg_packet_loss,
        "avg_disconnects_per_hr": avg_disconnects,
        "avg_signal_dbm": avg_signal,
        "sample_count": router_stats["sample_count"],
        "health_score": score,
    }

    # RULE 1: Healthy router
    if score >= HEALTHY_THRESHOLD:
        if has_complaints:
            return {
                "cause": (
                    f"Router metrics are healthy (score {score}/100). "
                    f"Speed {avg_speed} Mbps vs fleet avg {fleet_avg_speed} Mbps, "
                    f"packet loss {avg_packet_loss}%, latency {avg_latency} ms. "
                    "Complaints likely reflect user-side issues or expectations."
                ),
                "fix": "user education",
                "numbers": cited_numbers,
                "explanation": (
                    f"This router scores {score}/100, above the healthy threshold of {HEALTHY_THRESHOLD}. "
                    "Its network metrics are within normal fleet ranges. "
                    "The complaints may stem from device-level issues, browser problems, or "
                    "unrealistic speed expectations. User education is recommended."
                ),
            }
        else:
            return {
                "cause": (
                    f"Router is healthy (score {score}/100). "
                    f"Speed: {avg_speed} Mbps, latency: {avg_latency} ms, "
                    f"packet loss: {avg_packet_loss}%, disconnects: {avg_disconnects}/hr."
                ),
                "fix": None,
                "numbers": cited_numbers,
                "explanation": (
                    f"This router scores {score}/100, well above the healthy threshold. "
                    "All key metrics are within normal fleet ranges. No action required."
                ),
            }

    # RULE 2: Poor signal → relocate
    if avg_signal < fleet_p25_signal and avg_signal < -70:
        cause_parts = [f"Very weak signal ({avg_signal} dBm vs fleet avg {fleet_stats['fleet_avg_signal']} dBm)"]
        if avg_packet_loss > fleet_avg_packet_loss:
            cause_parts.append(f"high packet loss ({avg_packet_loss}%)")
        if avg_disconnects > fleet_avg_disconnects:
            cause_parts.append(f"frequent disconnects ({avg_disconnects}/hr)")
        return {
            "cause": "Physical placement issue: " + " and ".join(cause_parts) + ".",
            "fix": "relocate router",
            "numbers": cited_numbers,
            "explanation": (
                f"The router's signal strength ({avg_signal} dBm) is in the worst 25% of the fleet "
                f"(fleet avg: {fleet_stats['fleet_avg_signal']} dBm). "
                "This typically indicates walls, distance, or interference blocking the signal. "
                "Relocating the router closer to users or away from interference sources is recommended."
            ),
        }

    # RULE 3: High packet loss + high disconnects → firmware update
    if avg_packet_loss > fleet_p75_packet_loss and avg_disconnects > fleet_p75_disconnects:
        return {
            "cause": (
                f"High packet loss ({avg_packet_loss}% vs fleet avg {fleet_avg_packet_loss}%) "
                f"and frequent disconnects ({avg_disconnects}/hr vs fleet avg {fleet_avg_disconnects}/hr) "
                "sustained over all sampled hours."
            ),
            "fix": "firmware update",
            "numbers": cited_numbers,
            "explanation": (
                f"Sustained packet loss ({avg_packet_loss}%) and disconnect rate ({avg_disconnects}/hr) "
                "both exceed the fleet's 75th percentile. This pattern — packet loss combined with frequent "
                "connection drops — is typically caused by firmware bugs in connection handling. "
                "A firmware update is the first recommended action."
            ),
        }

    # RULE 4: Very low score + long history → replace
    if score < 20 and router_stats["sample_count"] >= 48:
        return {
            "cause": (
                f"Severely degraded performance across all metrics (score {score}/100) "
                f"sustained over {router_stats['sample_count']} hours."
            ),
            "fix": "replace router",
            "numbers": cited_numbers,
            "explanation": (
                f"Score of {score}/100 over {router_stats['sample_count']} hours indicates "
                "persistent hardware-level failure. All metrics are in the bottom tier of the fleet. "
                "Replacement is recommended."
            ),
        }

    # RULE 5: Default — firmware update for generally poor performance
    worst_metric = max(
        [
            ("speed", abs(avg_speed - fleet_avg_speed) / max(fleet_avg_speed, 1)),
            ("latency", abs(avg_latency - fleet_avg_latency) / max(fleet_avg_latency, 1)),
            ("packet_loss", abs(avg_packet_loss - fleet_avg_packet_loss) / max(fleet_avg_packet_loss, 0.1)),
        ],
        key=lambda x: x[1],
    )
    return {
        "cause": (
            f"Below-average performance (score {score}/100). "
            f"Worst metric: {worst_metric[0]} "
            f"(avg_speed: {avg_speed} Mbps, avg_latency: {avg_latency} ms, "
            f"avg_packet_loss: {avg_packet_loss}%)."
        ),
        "fix": "firmware update",
        "numbers": cited_numbers,
        "explanation": (
            f"Router score is {score}/100. The most deviant metric from fleet average is {worst_metric[0]}. "
            "A firmware update is recommended as the first troubleshooting step."
        ),
    }


def _llm_diagnosis(
    router_id: str,
    router_info: dict,
    router_stats: dict,
    fleet_stats: dict,
    complaint_texts: list[str],
    question: str,
) -> dict:
    """Call Gemini with strictly grounded prompt. Returns structured result."""

    complaint_block = (
        "\n".join(f"  - {c}" for c in complaint_texts) if complaint_texts else "  (none)"
    )

    prompt = f"""You are a network diagnostics assistant for a college ISP.
You MUST only use the data provided below. Do NOT invent any statistics or metrics.
Recommend exactly ONE fix from this list: firmware update, relocate router, replace router, user education.

=== ROUTER DATA ===
router_id: {router_id}
model: {router_info.get('model', 'unknown')}
firmware_version: {router_info.get('firmware_version', 'unknown')}
building: {router_info.get('building', 'unknown')}
room: {router_info.get('room', 'unknown')}
user_type: {router_info.get('user_type', 'unknown')}

=== PERFORMANCE METRICS (averaged over {router_stats['sample_count']} hourly samples) ===
avg_speed_mbps: {router_stats['avg_speed']} (fleet avg: {fleet_stats['fleet_avg_speed']})
avg_latency_ms: {router_stats['avg_latency']} (fleet avg: {fleet_stats['fleet_avg_latency']})
avg_packet_loss_pct: {router_stats['avg_packet_loss']} (fleet avg: {fleet_stats['fleet_avg_packet_loss']})
avg_disconnects_per_hr: {router_stats['avg_disconnects']} (fleet avg: {fleet_stats['fleet_avg_disconnects']})
avg_signal_dbm: {router_stats['avg_signal']} (fleet avg: {fleet_stats['fleet_avg_signal']})
health_score: {router_stats['score']} / 100

=== COMPLAINTS ({len(complaint_texts)} total) ===
{complaint_block}

=== QUESTION ===
{question}

=== INSTRUCTIONS ===
1. If health_score >= {HEALTHY_THRESHOLD} and no complaints: say the router is healthy, show the numbers, NO fix.
2. If health_score >= {HEALTHY_THRESHOLD} but complaints exist: recommend "user education" only.
3. If health_score < {HEALTHY_THRESHOLD}: identify the PRIMARY bad metric(s), cite the specific numbers.
4. Recommend exactly ONE fix: firmware update | relocate router | replace router | user education.
5. Never invent a number not present in the data above.

Respond in this exact JSON format (no markdown, no extra text):
{{
  "cause": "<one sentence stating the primary cause with specific numbers>",
  "fix": "<exactly one of: firmware update | relocate router | replace router | user education | none>",
  "explanation": "<2-4 sentences explaining the diagnosis with cited numbers>"
}}"""

    models_to_try = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]
    response = None
    last_err = None

    for m in models_to_try:
        try:
            model = genai.GenerativeModel(m)
            response = model.generate_content(prompt)
            break
        except Exception as err:
            last_err = err
            continue

    if response is None:
        raise last_err or Exception("All Gemini models failed")

    text = response.text.strip()

    # Strip markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    import json
    parsed = json.loads(text)

    # Ensure fix is valid
    fix = parsed.get("fix", "firmware update").lower().strip()
    if fix not in [f.lower() for f in FIX_OPTIONS] and fix != "none":
        fix = "firmware update"

    return {
        "cause": parsed.get("cause", ""),
        "fix": fix if fix != "none" else None,
        "numbers": {
            "avg_speed_mbps": router_stats["avg_speed"],
            "avg_latency_ms": router_stats["avg_latency"],
            "avg_packet_loss_pct": router_stats["avg_packet_loss"],
            "avg_disconnects_per_hr": router_stats["avg_disconnects"],
            "avg_signal_dbm": router_stats["avg_signal"],
            "sample_count": router_stats["sample_count"],
            "health_score": router_stats["score"],
        },
        "explanation": parsed.get("explanation", ""),
    }


def diagnose(
    router_id: str,
    question: str,
    router_info: dict,
    router_stats: dict,
    fleet_stats: dict,
    complaint_texts: list[str],
) -> dict:
    """
    Main entry point. Try LLM first; fall back to rule-based on any error.
    Returns: { cause, fix, numbers, explanation }
    """
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        try:
            genai.configure(api_key=api_key)
            result = _llm_diagnosis(router_id, router_info, router_stats, fleet_stats, complaint_texts, question)
            result["source"] = "gemini"
            return result
        except Exception as e:
            print(f"[Copilot] Gemini failed ({e}), falling back to rule-based.")

    result = _rule_based_diagnosis(router_stats, fleet_stats, complaint_texts)
    result["source"] = "rule-based"
    return result


