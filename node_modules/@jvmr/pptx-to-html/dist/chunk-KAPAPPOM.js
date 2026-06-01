var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/core/XmlHelper.ts
function libWarn(msg) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[pptx-to-html] ${msg}`);
  }
}
var XmlHelper = class _XmlHelper {
  static domParserFactory = null;
  /**
   * Parses a string containing XML into a DOM Document
   * @param xmlString XML string to parse
   * @returns DOM Document
   */
  static parseXml(xmlString) {
    if (_XmlHelper.domParserFactory) {
      return _XmlHelper.domParserFactory().parseFromString(xmlString, "application/xml");
    }
    const anyGlobal = globalThis;
    const DP = anyGlobal?.DOMParser;
    if (typeof DP === "function") {
      return new DP().parseFromString(xmlString, "application/xml");
    }
    try {
      const xmldom = __require("@xmldom/xmldom");
      const Parser = xmldom.DOMParser || xmldom?.DOMParser;
      if (Parser) {
        return new Parser().parseFromString(xmlString, "application/xml");
      }
    } catch {
    }
    libWarn("No DOMParser available. Use XmlHelper.setDomParser() or install '@xmldom/xmldom'.");
    throw new Error("DOMParser not available in this environment");
  }
  /**
   * Gets a direct child element by local tag name
   */
  static getDirectChildrenByTagName(parent, tag) {
    return Array.from(parent.children).filter(
      (child) => child.localName === tag
    );
  }
  /**
   * Gets attribute value as number, defaulting to 0
   */
  static getAttrAsNumber(el, name) {
    const raw = el.getAttribute(name);
    if (raw == null || raw === "") return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  static getColorFromElement(el, themeColors) {
    if (!el) return void 0;
    const srgb = el.getElementsByTagNameNS("*", "srgbClr")[0];
    if (srgb) {
      const val = srgb.getAttribute("val");
      return val ? `#${val}` : void 0;
    }
    const scheme = el.getElementsByTagNameNS("*", "schemeClr")[0];
    if (scheme) {
      const val = scheme.getAttribute("val");
      if (val && themeColors) {
        const aliasMap = {
          bg1: "lt1",
          bg2: "lt2",
          tx1: "dk1",
          tx2: "dk2"
        };
        const resolvedKey = aliasMap[val] || val;
        return themeColors[resolvedKey];
      }
      return void 0;
    }
    const sys = el.getElementsByTagNameNS("*", "sysClr")[0];
    if (sys) {
      const lastClr = sys.getAttribute("lastClr");
      return lastClr ? `#${lastClr}` : void 0;
    }
    return void 0;
  }
  static extractThemeColors(themeDoc) {
    if (!themeDoc) return {};
    const NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
    const themeColors = {};
    const clrScheme = themeDoc.getElementsByTagNameNS(NS, "clrScheme")[0];
    if (!clrScheme) return {};
    for (const node of Array.from(clrScheme.children)) {
      const name = node.localName;
      const srgbClr = node.getElementsByTagNameNS(NS, "srgbClr")[0];
      const sysClr = node.getElementsByTagNameNS(NS, "sysClr")[0];
      const hex = srgbClr?.getAttribute("val") ?? sysClr?.getAttribute("lastClr");
      if (hex) {
        themeColors[name] = `#${hex}`;
      }
    }
    return themeColors;
  }
  /**
   * Extracts table styles (fills and text colors per region) from theme XML.
   * Returns a map keyed by styleId (GUID or name), with region color maps.
   */
  static extractThemeTableStyles(themeDoc) {
    const styles = {};
    if (!themeDoc) return styles;
    const themeColors = _XmlHelper.extractThemeColors(themeDoc);
    const tblStyleLst = themeDoc.getElementsByTagNameNS("*", "tblStyleLst")[0] || null;
    if (!tblStyleLst) return styles;
    const tblStyles = Array.from(tblStyleLst.getElementsByTagNameNS("*", "tblStyle"));
    for (const ts of tblStyles) {
      const id = ts.getAttribute("styleId") || ts.getAttribute("name") || "";
      if (!id) continue;
      const fills = {};
      const fontColors = {};
      const prNodes = Array.from(ts.getElementsByTagNameNS("*", "tblStylePr"));
      for (const pr of prNodes) {
        const type = pr.getAttribute("type") || pr.getAttribute("val") || "";
        if (!type) continue;
        const tcStyle = pr.getElementsByTagNameNS("*", "tcStyle")[0] || null;
        const tcPr = tcStyle?.getElementsByTagNameNS("*", "tcPr")[0] || null;
        const solidCandidates = [
          tcPr?.getElementsByTagNameNS("*", "solidFill")[0] || null,
          tcStyle?.getElementsByTagNameNS("*", "solidFill")[0] || null,
          pr.getElementsByTagNameNS("*", "solidFill")[0] || null
        ];
        let fillColor;
        for (const cand of solidCandidates) {
          if (cand && !fillColor) fillColor = _XmlHelper.getColorFromElement(cand, themeColors);
        }
        if (!fillColor) {
          const fillRef = tcStyle?.getElementsByTagNameNS("*", "fillRef")[0] || pr.getElementsByTagNameNS("*", "fillRef")[0] || null;
          fillColor = _XmlHelper.getColorFromElement(fillRef, themeColors);
        }
        if (fillColor) fills[type] = fillColor;
        const txStyle = pr.getElementsByTagNameNS("*", "tcTxStyle")[0] || null;
        const txFillSolid = txStyle?.getElementsByTagNameNS("*", "solidFill")[0] || null;
        let textColor = _XmlHelper.getColorFromElement(txFillSolid, themeColors);
        if (!textColor) {
          const fontRef = txStyle?.getElementsByTagNameNS("*", "fontRef")[0] || null;
          textColor = _XmlHelper.getColorFromElement(fontRef, themeColors);
        }
        if (!textColor) {
          const anyScheme = txStyle?.getElementsByTagNameNS("*", "schemeClr")[0] || null;
          textColor = _XmlHelper.getColorFromElement(anyScheme, themeColors);
        }
        if (textColor) fontColors[type] = textColor;
      }
      styles[id] = { fills, fontColors };
    }
    return styles;
  }
  /** Allow host to provide a DOM parser (e.g., new (require('@xmldom/xmldom').DOMParser)()) */
  static setDomParser(factory) {
    _XmlHelper.domParserFactory = factory;
  }
  /** Relationship lookup: by Type suffix (avoids querySelector CSS) */
  static findRelationshipByTypeSuffix(doc, suffix) {
    const rels = doc.getElementsByTagName("Relationship");
    for (const el of Array.from(rels)) {
      const t = el.getAttribute("Type") || "";
      if (t.endsWith(suffix)) return el;
    }
    return null;
  }
  /** Relationship lookup: by Id */
  static findRelationshipById(doc, id) {
    const rels = doc.getElementsByTagName("Relationship");
    for (const el of Array.from(rels)) {
      if (el.getAttribute("Id") === id) return el;
    }
    return null;
  }
};

export {
  XmlHelper
};
//# sourceMappingURL=chunk-KAPAPPOM.js.map