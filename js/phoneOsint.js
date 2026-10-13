// CyberTrace Phone OSINT & Telecom Analyzer Engine
class PhoneOsintEngine {
  constructor(db) {
    this.db = db || (typeof window !== 'undefined' ? window.PHONE_DATABASE : null) || (typeof PHONE_DATABASE !== 'undefined' ? PHONE_DATABASE : null);
  }

  getDb() {
    return this.db || (typeof window !== 'undefined' ? window.PHONE_DATABASE : null) || (typeof PHONE_DATABASE !== 'undefined' ? PHONE_DATABASE : { countries: [], highRiskPrefixes: [] });
  }

  // Sanitize input number string
  cleanNumber(rawInput) {
    if (!rawInput) return "";
    return rawInput.trim().replace(/[^\d+]/g, "");
  }

  // Parse and match country from E.164 string
  parseNumber(rawInput) {
    const cleaned = this.cleanNumber(rawInput);
    if (!cleaned) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    const db = this.getDb();
    if (!db || !db.countries) {
      return { success: false, error: "Phone database is loading. Please try again." };
    }

    let digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    let matchedCountry = null;
    let nationalNumber = "";
    let dialCode = "";

    // Sort countries by dialing code length descending to match longest prefix first (e.g. 971 before 97)
    const sortedCountries = [...db.countries].sort((a, b) => {
      const codeA = a.dialCode || a.code;
      const codeB = b.dialCode || b.code;
      return codeB.length - codeA.length;
    });

    for (const c of sortedCountries) {
      const code = c.dialCode || c.code;
      if (digits.startsWith(code)) {
        matchedCountry = c;
        dialCode = code;
        nationalNumber = digits.slice(code.length);
        break;
      }
    }

    // Default fallback if leading "+" but unmatched
    if (!matchedCountry) {
      // Check high-risk satellite prefixes
      const satelliteMatch = (db.highRiskPrefixes || []).find(p => digits.startsWith(p.prefix));
      if (satelliteMatch) {
        return {
          success: true,
          isSatellite: true,
          rawInput,
          cleaned: "+" + digits,
          dialCode: satelliteMatch.prefix,
          nationalNumber: digits.slice(satelliteMatch.prefix.length),
          country: {
            name: satelliteMatch.label,
            iso: "XX",
            flag: "🛰️",
            capital: "Global Orbit",
            coords: [0, 0]
          },
          lineType: "Satellite Network",
          carrier: { name: satelliteMatch.label, type: "Satellite" },
          riskScore: satelliteMatch.risk,
          riskLevel: "HIGH",
          riskReasons: [satelliteMatch.reason, "Extremely high international termination rate", "Non-geographic telecommunications identity"],
          nominalCoords: [0, 0]
        };
      }

      return {
        success: false,
        error: "Unrecognized international dialing code. Ensure number starts with country code (e.g., +1, +44, +91)."
      };
    }

    // Analyze National Number
    const lengthValid = matchedCountry.lengths ? matchedCountry.lengths.includes(nationalNumber.length) : true;
    
    // Determine Line Type & Carrier
    const lineAnalysis = this.analyzeLineAndCarrier(matchedCountry, nationalNumber);
    
    // Calculate Risk & Fraud Score
    const riskAnalysis = this.calculateRiskScore(matchedCountry, nationalNumber, lineAnalysis, lengthValid);

    // Format output
    const e164 = `+${dialCode}${nationalNumber}`;
    const nationalFormatted = this.formatNational(nationalNumber, matchedCountry.format);

    return {
      success: true,
      rawInput,
      cleaned: e164,
      e164,
      rfc3966: `tel:${e164}`,
      dialCode: `+${dialCode}`,
      nationalNumber,
      nationalFormatted,
      lengthValid,
      expectedLengths: matchedCountry.lengths,
      country: matchedCountry,
      lineType: lineAnalysis.lineType,
      carrier: lineAnalysis.carrier,
      riskScore: riskAnalysis.score,
      riskLevel: riskAnalysis.level,
      riskReasons: riskAnalysis.reasons,
      nominalCoords: matchedCountry.coords,
      telecomPrivacyNotice: "Live GPS coordinates and exact street address are NOT retrievable through phone numbers alone without carrier access or device location consent. Displayed coordinates represent nominal country/region center."
    };
  }

  // Analyze line type (Mobile, Fixed-Line, VoIP, Toll-Free, Premium) & Carrier
  analyzeLineAndCarrier(country, nationalNumber) {
    let lineType = "Fixed-Line / General";
    let carrier = { name: "Regional Telecom Provider", type: "Unknown" };

    // Toll-Free Check
    if (country.tollFreePrefixes && country.tollFreePrefixes.some(p => nationalNumber.startsWith(p))) {
      return {
        lineType: "Toll-Free (Enterprise)",
        carrier: { name: "National Toll-Free Service", type: "Toll-Free" }
      };
    }

    // Premium Rate Check
    if (country.premiumPrefixes && country.premiumPrefixes.some(p => nationalNumber.startsWith(p))) {
      return {
        lineType: "Premium Rate (High Charge)",
        carrier: { name: "Specialized Premium Content Provider", type: "Premium" }
      };
    }

    // VoIP Check
    if (country.voipPrefixes && country.voipPrefixes.some(p => nationalNumber.startsWith(p))) {
      return {
        lineType: "VoIP / Virtual Cloud Number",
        carrier: { name: "Cloud VoIP Provider (Twilio/Bandwidth/Skype)", type: "VoIP" }
      };
    }

    // Mobile Prefix Check
    if (country.mobilePrefixes && country.mobilePrefixes.some(p => nationalNumber.startsWith(p))) {
      lineType = "Mobile / Cellular (GSM/LTE/5G)";
    } else if (country.iso === "US" || country.iso === "CA") {
      // In NANP (US/CA), numbers are geographically assigned, often mobile or landline
      lineType = "Mobile / Wireline (NANP)";
    }

    // Match Carrier by specific prefix
    if (country.carriers && country.carriers.length > 0) {
      const match = country.carriers.find(c => c.prefix && nationalNumber.startsWith(c.prefix));
      if (match) {
        carrier = match;
      } else {
        // Fallback to primary national carrier
        carrier = country.carriers[0];
      }
    }

    return { lineType, carrier };
  }

  // Calculate Risk / Fraud Rating (0-100)
  calculateRiskScore(country, nationalNumber, lineAnalysis, lengthValid) {
    let score = 10; // Baseline low risk for valid numbers
    const reasons = [];

    // Length check
    if (!lengthValid) {
      score += 30;
      reasons.push("National number length does not match official ITU standard");
    }

    // VoIP check (major vector for automated robocalls and identity spoofing)
    if (lineAnalysis.lineType.includes("VoIP")) {
      score += 45;
      reasons.push("Virtual VoIP line: frequently utilized for disposable SMS reception & automated caller-ID spoofing");
    }

    // Premium rate check
    if (lineAnalysis.lineType.includes("Premium")) {
      score += 55;
      reasons.push("Premium rate number: charges caller exorbitant per-minute rates");
    }

    // Toll-Free
    if (lineAnalysis.lineType.includes("Toll-Free")) {
      score += 15;
      reasons.push("Toll-free identity: business line, cannot receive standard personal SMS");
    }

    // Repetitive or suspicious digit patterns (e.g., 000000, 111111)
    if (/(\d)\1{5,}/.test(nationalNumber)) {
      score += 25;
      reasons.push("Unusual repetitive digit pattern (potential test number or spoofed caller ID)");
    }

    // High risk country / prefix check
    const db = this.getDb();
    const riskCheck = (db.highRiskPrefixes || []).find(p => nationalNumber.startsWith(p.prefix));
    if (riskCheck) {
      score += 40;
      reasons.push(riskCheck.reason);
    }

    // Clamp score
    score = Math.min(100, Math.max(5, score));

    let level = "LOW";
    if (score >= 60) level = "HIGH";
    else if (score >= 35) level = "MEDIUM";

    if (reasons.length === 0) {
      reasons.push("Standard cellular allocation with normal subscriber characteristics");
    }

    return { score, level, reasons };
  }

  // Format national string according to mask
  formatNational(digits, mask) {
    if (!mask) return digits;
    let res = "";
    let dIdx = 0;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 'X') {
        if (dIdx < digits.length) {
          res += digits[dIdx++];
        } else {
          break;
        }
      } else {
        res += mask[i];
      }
    }
    if (dIdx < digits.length) {
      res += " " + digits.slice(dIdx);
    }
    return res;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhoneOsintEngine;
}
