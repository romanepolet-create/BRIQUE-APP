const matriceGMS = {
  "AUCHAN HM": { obligatoire: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33",  "YT33"], facultatif: [], direct: ["LB44", "NQ44", "YT44", "ML44", "SH75", "TC75", "UA33", "DB44"] },
  "AUCHAN SM": { obligatoire: [], facultatif: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33", "YT33"], direct: ["SH75", "TC75", "LB44", "NQ44", "YT44", "ML44", "UA33"] }, 
  "CASINO": { obligatoire: ["LB44", "NQ44", "YT44", "LB33"], facultatif: [], direct: ["LB75", "NQ75", "ML75", "YT75", "SH75", "TC75", "ML44", "NQ33", "YT33", "UA33", "DB44"] },
  "FRANPRIX": { obligatoire: ["LB44", "YT44"], facultatif: [], direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "NQ44", "ML44", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "MONOPRIX": { obligatoire: ["LB75", "LB44", "NQ44", "YT44"], facultatif: [], direct: ["NQ75", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "CRF HYPER": { obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], facultatif: [], direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "CRF MARKET": { obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], facultatif: [], direct: ["NQ44", "YT44", "SH75", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "CRF PROXI": { obligatoire: [], facultatif: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "ITM PROXI": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "ITM SM": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "LECLERC": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "LECLERC PROXI": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "OTERA": { obligatoire: ["LB44", "NQ44", "YT44", "ML44"], facultatif: [], direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "LB33", "NQ33", "YT33", "UA33", "DB44"] },
  "SUPER U": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "G 20": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "U EXPRESS": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "LECLERC DRIVE": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "MATCH": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] },
  "NICOLAS": { obligatoire: ["NQ33", "YT33", "ML44", "LB44"], facultatif: [], direct: ["LB75", "ML75", "TC75", "NQ75", "SH75", "YT75", "NQ44","YT44", "LB33", "UA33", "DB44"] },
  "AUTRES": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"] }
};

function getCouleurEnseigne(enseigne) {
  if(!enseigne) return "#555555";
  const enseignePropre = enseigne.trim().toUpperCase();
  const couleurs = {
    "SUPER U": "#7304E7", "MONOPRIX": "#f8de0d", "AUCHAN SM": "#f8190d", "CRF MARKET": "#3002d4",
    "LECLERC PROXI": "#fa1ee5", "LECLERC": "#ff99f5", "ITM SM": "#01981e", "ITM PROXI": "#14fa23",
    "FRANPRIX": "#fe3943", "CRF PROXI": "#4dbeff", "CRF HYPER": "#4d7fff", "CASINO": "#baab2c",
    "AUCHAN HM": "#fe7e71", "OTERA": "#ff871f", "MATCH": "#d1001f", "U EXPRESS": "#a000ff",
    "LECLERC DRIVE": "#ff66cc", "G 20": "#00b050", "NICOLAS": "#cc540e", "AUTRES": "#808080",
  } 
  return couleurs[enseignePropre] || "#555555";
}
