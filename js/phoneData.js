// CyberTrace Global Phone & Telecom Intelligence Dataset
const PHONE_DATABASE = {
  countries: [
    {
      code: "1",
      iso: "US",
      name: "United States",
      flag: "🇺🇸",
      capital: "Washington, D.C.",
      coords: [38.9072, -77.0369],
      lengths: [10],
      format: "(XXX) XXX-XXXX",
      carriers: [
        { name: "Verizon Wireless", type: "Mobile", mnc: "311-480" },
        { name: "AT&T Mobility", type: "Mobile", mnc: "310-410" },
        { name: "T-Mobile US", type: "Mobile", mnc: "310-260" },
        { name: "Bandwidth / Twilio", type: "VoIP/Virtual", mnc: "N/A" }
      ],
      voipPrefixes: ["201800", "202450", "312780", "415800", "646900", "702900"],
      tollFreePrefixes: ["800", "888", "877", "866", "855", "844", "833"],
      premiumPrefixes: ["900"]
    },
    {
      code: "1-CA",
      dialCode: "1",
      iso: "CA",
      name: "Canada",
      flag: "🇨🇦",
      capital: "Ottawa, Ontario",
      coords: [45.4215, -75.6972],
      lengths: [10],
      format: "(XXX) XXX-XXXX",
      areaCodes: ["416", "647", "437", "604", "778", "236", "514", "438", "403", "587", "825"],
      carriers: [
        { name: "Rogers Wireless", type: "Mobile" },
        { name: "Bell Mobility", type: "Mobile" },
        { name: "Telus Mobility", type: "Mobile" },
        { name: "Freedom Mobile", type: "Mobile" }
      ]
    },
    {
      code: "44",
      dialCode: "44",
      iso: "GB",
      name: "United Kingdom",
      flag: "🇬🇧",
      capital: "London",
      coords: [51.5074, -0.1278],
      lengths: [10],
      format: "XXXX XXXXXX",
      mobilePrefixes: ["7"],
      carriers: [
        { name: "EE (BT Group)", type: "Mobile" },
        { name: "O2 (Virgin Media)", type: "Mobile" },
        { name: "Vodafone UK", type: "Mobile" },
        { name: "Three (CK Hutchison)", type: "Mobile" },
        { name: "SkypeIn / Virtual VoIP", type: "VoIP/Virtual" }
      ],
      voipPrefixes: ["56", "70"],
      premiumPrefixes: ["90", "98", "91"]
    },
    {
      code: "91",
      dialCode: "91",
      iso: "IN",
      name: "India",
      flag: "🇮🇳",
      capital: "New Delhi",
      coords: [28.6139, 77.2090],
      lengths: [10],
      format: "XXXXX XXXXX",
      mobilePrefixes: ["6", "7", "8", "9"],
      carriers: [
        { prefix: "98", name: "Bharti Airtel", type: "Mobile" },
        { prefix: "99", name: "Bharti Airtel", type: "Mobile" },
        { prefix: "97", name: "Bharti Airtel", type: "Mobile" },
        { prefix: "70", name: "Reliance Jio Infocomm", type: "Mobile" },
        { prefix: "79", name: "Reliance Jio Infocomm", type: "Mobile" },
        { prefix: "63", name: "Reliance Jio Infocomm", type: "Mobile" },
        { prefix: "94", name: "BSNL Mobile", type: "Mobile" },
        { prefix: "95", name: "Vodafone Idea (Vi)", type: "Mobile" },
        { prefix: "96", name: "Vodafone Idea (Vi)", type: "Mobile" },
        { prefix: "93", name: "Vodafone Idea (Vi)", type: "Mobile" }
      ],
      defaultCarriers: ["Reliance Jio", "Bharti Airtel", "Vodafone Idea (Vi)", "BSNL"]
    },
    {
      code: "49",
      dialCode: "49",
      iso: "DE",
      name: "Germany",
      flag: "🇩🇪",
      capital: "Berlin",
      coords: [52.5200, 13.4050],
      lengths: [10, 11],
      format: "XXX XXXXXXXX",
      mobilePrefixes: ["15", "16", "17"],
      carriers: [
        { prefix: "151", name: "Deutsche Telekom", type: "Mobile" },
        { prefix: "160", name: "Deutsche Telekom", type: "Mobile" },
        { prefix: "170", name: "Deutsche Telekom", type: "Mobile" },
        { prefix: "152", name: "Vodafone Deutschland", type: "Mobile" },
        { prefix: "172", name: "Vodafone Deutschland", type: "Mobile" },
        { prefix: "176", name: "Telefónica O2 Germany", type: "Mobile" },
        { prefix: "179", name: "Telefónica O2 Germany", type: "Mobile" }
      ],
      voipPrefixes: ["32"]
    },
    {
      code: "33",
      dialCode: "33",
      iso: "FR",
      name: "France",
      flag: "🇫🇷",
      capital: "Paris",
      coords: [48.8566, 2.3522],
      lengths: [9],
      format: "X XX XX XX XX",
      mobilePrefixes: ["6", "7"],
      carriers: [
        { name: "Orange S.A.", type: "Mobile" },
        { name: "SFR (Altice)", type: "Mobile" },
        { name: "Bouygues Telecom", type: "Mobile" },
        { name: "Free Mobile (Iliad)", type: "Mobile" }
      ],
      voipPrefixes: ["9"]
    },
    {
      code: "61",
      dialCode: "61",
      iso: "AU",
      name: "Australia",
      flag: "🇦🇺",
      capital: "Canberra",
      coords: [-35.2809, 149.1300],
      lengths: [9],
      format: "XXX XXX XXX",
      mobilePrefixes: ["4"],
      carriers: [
        { name: "Telstra", type: "Mobile" },
        { name: "Optus (Singtel)", type: "Mobile" },
        { name: "Vodafone Australia (TPG)", type: "Mobile" }
      ]
    },
    {
      code: "81",
      dialCode: "81",
      iso: "JP",
      name: "Japan",
      flag: "🇯🇵",
      capital: "Tokyo",
      coords: [35.6762, 139.6503],
      lengths: [10],
      format: "XX-XXXX-XXXX",
      mobilePrefixes: ["70", "80", "90"],
      carriers: [
        { name: "NTT Docomo", type: "Mobile" },
        { name: "au (KDDI)", type: "Mobile" },
        { name: "SoftBank Corp.", type: "Mobile" },
        { name: "Rakuten Mobile", type: "Mobile" }
      ]
    },
    {
      code: "86",
      dialCode: "86",
      iso: "CN",
      name: "China",
      flag: "🇨🇳",
      capital: "Beijing",
      coords: [39.9042, 116.4074],
      lengths: [11],
      format: "XXX XXXX XXXX",
      mobilePrefixes: ["13", "14", "15", "17", "18", "19"],
      carriers: [
        { name: "China Mobile", type: "Mobile" },
        { name: "China Telecom", type: "Mobile" },
        { name: "China Unicom", type: "Mobile" },
        { name: "China Broadnet", type: "Mobile" }
      ]
    },
    {
      code: "971",
      dialCode: "971",
      iso: "AE",
      name: "United Arab Emirates",
      flag: "🇦🇪",
      capital: "Abu Dhabi",
      coords: [24.4539, 54.3773],
      lengths: [9],
      format: "XX XXX XXXX",
      mobilePrefixes: ["50", "52", "54", "55", "56", "58"],
      carriers: [
        { prefix: "50", name: "e& (Etisalat)", type: "Mobile" },
        { prefix: "54", name: "e& (Etisalat)", type: "Mobile" },
        { prefix: "56", name: "e& (Etisalat)", type: "Mobile" },
        { prefix: "52", name: "du (EITC)", type: "Mobile" },
        { prefix: "55", name: "du (EITC)", type: "Mobile" },
        { prefix: "58", name: "Virgin Mobile UAE", type: "Mobile" }
      ]
    },
    {
      code: "55",
      dialCode: "55",
      iso: "BR",
      name: "Brazil",
      flag: "🇧🇷",
      capital: "Brasília",
      coords: [-15.7975, -47.8919],
      lengths: [10, 11],
      format: "XX XXXXX-XXXX",
      carriers: [
        { name: "Vivo (Telefônica Brasil)", type: "Mobile" },
        { name: "Claro (América Móvil)", type: "Mobile" },
        { name: "TIM Brasil", type: "Mobile" }
      ]
    },
    {
      code: "234",
      dialCode: "234",
      iso: "NG",
      name: "Nigeria",
      flag: "🇳🇬",
      capital: "Abuja",
      coords: [9.0765, 7.3986],
      lengths: [10],
      format: "XXX XXX XXXX",
      carriers: [
        { name: "MTN Nigeria", type: "Mobile" },
        { name: "Airtel Nigeria", type: "Mobile" },
        { name: "Glo (Globacom)", type: "Mobile" },
        { name: "9mobile", type: "Mobile" }
      ]
    },
    {
      code: "7",
      dialCode: "7",
      iso: "RU",
      name: "Russia",
      flag: "🇷🇺",
      capital: "Moscow",
      coords: [55.7558, 37.6173],
      lengths: [10],
      format: "XXX XXX-XX-XX",
      mobilePrefixes: ["9"],
      carriers: [
        { name: "MTS", type: "Mobile" },
        { name: "MegaFon", type: "Mobile" },
        { name: "Beeline (VEON)", type: "Mobile" },
        { name: "Tele2 Russia", type: "Mobile" }
      ]
    },
    {
      code: "65",
      dialCode: "65",
      iso: "SG",
      name: "Singapore",
      flag: "🇸🇬",
      capital: "Singapore",
      coords: [1.3521, 103.8198],
      lengths: [8],
      format: "XXXX XXXX",
      mobilePrefixes: ["8", "9"],
      carriers: [
        { name: "Singtel Mobile", type: "Mobile" },
        { name: "StarHub", type: "Mobile" },
        { name: "M1 Limited", type: "Mobile" },
        { name: "SIMBA Telecom", type: "Mobile" }
      ]
    },
    {
      code: "27",
      dialCode: "27",
      iso: "ZA",
      name: "South Africa",
      flag: "🇿🇦",
      capital: "Pretoria",
      coords: [-25.7479, 28.2293],
      lengths: [9],
      format: "XX XXX XXXX",
      carriers: [
        { name: "Vodacom", type: "Mobile" },
        { name: "MTN South Africa", type: "Mobile" },
        { name: "Telkom SA", type: "Mobile" },
        { name: "Cell C", type: "Mobile" }
      ]
    }
  ],

  // Known high-risk satellite or international one-ring scam (Wangiri) prefixes
  highRiskPrefixes: [
    { prefix: "870", label: "SNAC (Inmarsat Satellite)", risk: 85, reason: "Satellite maritime network ($8-$15/min call rates)" },
    { prefix: "881", label: "Global Mobile Satellite", risk: 90, reason: "Iridium/Globalstar satellite network" },
    { prefix: "232", label: "Sierra Leone", risk: 65, reason: "Frequently abused in Wangiri one-ring toll fraud" },
    { prefix: "252", label: "Somalia", risk: 70, reason: "Common Wangiri spoofing origin" },
    { prefix: "882", label: "International Networks", risk: 80, reason: "Non-geographic telecommunications identity" }
  ],

  // Preset demo numbers for user interaction and testing
  demoPresets: [
    { label: "US Mobile (Verizon)", number: "+1 202 555 0193", note: "Standard North American mobile format" },
    { label: "India Mobile (Jio)", number: "+91 98765 43210", note: "10-digit Indian National cellular" },
    { label: "UK Mobile (Vodafone)", number: "+44 7911 123456", note: "British OFCOM mobile allocation" },
    { label: "German VoIP/Virtual", number: "+49 32 12345678", note: "German 032 National VoIP block" },
    { label: "US Toll-Free (800)", number: "+1 800 555 0149", note: "Toll-free non-geographic enterprise line" },
    { label: "Satellite/High Risk", number: "+870 762 123456", note: "Inmarsat maritime satellite identity" }
  ]
};

if (typeof window !== 'undefined') {
  window.PHONE_DATABASE = PHONE_DATABASE;
}
if (typeof globalThis !== 'undefined') {
  globalThis.PHONE_DATABASE = PHONE_DATABASE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHONE_DATABASE;
}
