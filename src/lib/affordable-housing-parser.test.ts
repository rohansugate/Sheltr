import { describe, expect, it } from "vitest";
import { parseAffordableHousingHtml } from "@/lib/affordable-housing-parser";

const SAMPLE = `
<div class='premiumcard jq-cardhover' data-communityid='99123'>
  <a href='https://www.affordablehousing.com/listing/123-test-home'>
    <img src='https://example.com/photo.jpg' loading='lazy'>
    <div class='premiumcard--communityname'><span>Test Community</span></div>
    <div class='premiumcard--price'>$1,850</div>
    <div class='premiumcard--details'>2 <span class="card--value">bed</span> · 1 <span class="card--value">bath</span></div>
    <div class='tnresult--propertyaddress'>123 Main St, Los Angeles, CA 90011</div>
    <span class='ic--go8--badge'></span>
  </a>
</div>
`;

describe("parseAffordableHousingHtml", () => {
  it("parses listing cards from Affordable Housing HTML", () => {
    const results = parseAffordableHousingHtml(SAMPLE, "90011");
    expect(results.length).toBe(1);
    expect(results[0]?.title).toContain("Test Community");
    expect(results[0]?.monthlyRent).toBe(1850);
    expect(results[0]?.bedrooms).toBe(2);
    expect(results[0]?.zipCode).toBe("90011");
    expect(results[0]?.sourceUrl).toContain("affordablehousing.com");
  });
});
