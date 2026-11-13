import importlib.util
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("assess_evidence", ROOT / "scripts" / "assess_evidence.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def report():
    return {
        "organization": "Example Co",
        "businessProblem": "Manual invoices",
        "aiWorkflow": "AI extracts invoice fields",
        "deploymentStatus": "pilot",
        "reportedOutcome": "Mixed",
        "sourceAssessment": "Company reported",
        "numericClaims": [{
            "claim": "Time savings", "reportedValue": "25", "unit": "%",
            "denominator": "invoices", "period": "Q1",
            "sourceId": "S1", "exactExcerpt": "Time saved 25% in pilot.",
            "validationStatus": "cross_checked", "limitation": "Vendor claim."
        }],
        "supportingEvidence": [{
            "sourceId": "S1", "exactExcerpt": "Time saved 25% in pilot.",
            "interpretation": "Company-reported result"
        }],
        "contradictoryEvidence": [], "unresolvedQuestions": ["Is this repeatable?"],
        "riskFlags": ["Errors"], "suggestedCaseSummary": "AI invoice test",
        "studentLesson": "Check evidence", "professionalApplication": "Pilot on 20 invoices"
    }

class AssessmentTests(unittest.TestCase):
    def test_excerpt_must_exist(self):
        data=report()
        data["supportingEvidence"][0]["exactExcerpt"]="A fabricated verbatim quote"
        with self.assertRaises(ValueError):
            mod.validate_report(data, [{"url":"https://example.com/story","text":"Time saved 25% in pilot."}])

    def test_automatic_cross_check_not_certified(self):
        data=report()
        result=mod.validate_report(data,[{"url":"https://example.com/story","text":"Time saved 25% in pilot."}])
        self.assertEqual(result["numericClaims"][0]["validationStatus"],"reported_only")

    def test_insecure_source_rejected(self):
        for url in ("http://example.com","https://localhost/x","https://127.0.0.1/test",
                    "https://169.254.169.254/latest", "file:///etc/passwd"):
            self.assertFalse(mod.safe_url(url),url)

    def test_key_missing_creates_unapproved_draft_without_network(self):
        candidate={"id":"candidate-test","title":"Example AI case","discoveryUrl":"https://example.com/a"}
        with patch.object(mod,"KEY",""), patch.object(mod,"related_links",side_effect=AssertionError("network called")):
            result=mod.assess(candidate)
        self.assertEqual(result["status"],"needs_configuration")
        self.assertTrue(result["publicationBlocked"])
        self.assertEqual(result["reviewStatus"],"unapproved")

if __name__=="__main__":
    unittest.main()
