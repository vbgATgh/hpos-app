from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCREEN = (ROOT / "supabase/functions/hpos-screen/index.ts").read_text(encoding="utf-8")
CLASSIFIER = (ROOT / "supabase/functions/hpos-screen/business-classifier.ts").read_text(encoding="utf-8")


def test_business_classifier_is_generic_versioned_and_fail_closed():
    assert 'import { classifyBusiness } from "./business-classifier.ts"' in SCREEN
    assert "function classifyBusiness" in CLASSIFIER
    assert "OFFICIAL_BUSINESS_EXCLUSION_V1" in CLASSIFIER
    assert "OFFICIAL_SIC_NEGATIVE_SCREEN_V1" in CLASSIFIER
    assert "OFFICIAL_DESCRIPTION_POSITIVE_SCREEN_V1" in CLASSIFIER
    assert "OFFICIAL_BUSINESS_DESCRIPTION_UNCLASSIFIED" in CLASSIFIER
    assert 'if (!official) return { state: "OPEN"' in CLASSIFIER


def test_official_sec_and_esef_paths_use_the_same_classifier():
    assert 'classifyBusiness(parsed.businessDescription, "", true' in SCREEN
    assert 'classifyBusiness(business, "", true' in SCREEN
    assert "classifyBusiness(sicDescription, sic, !!submissionsResponse" in SCREEN
    assert 'state: ["PASS", "FAIL"].includes(b.state) ? b.state : "OPEN"' in SCREEN


def test_classifier_covers_core_exclusions_and_novo_healthcare_signal():
    for marker in [
        "CONVENTIONAL BANKING",
        "CONVENTIONAL INSURANCE",
        "GAMBLING",
        "TOBACCO",
        "PORK PROCESSING",
        "FIREARMS",
        "ADULT ENTERTAINMENT",
    ]:
        assert marker in CLASSIFIER
    assert "HEALTHCARE_AND_LIFE_SCIENCES" in CLASSIFIER
    assert "PHARMACEUTICAL" in CLASSIFIER
