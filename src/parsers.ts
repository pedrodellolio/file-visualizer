export const safeParseJSON = (
  jsonString: string
): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
      return parsed;
    return null;
  } catch (err) {
    return null;
  }
};

export function safeParseXML(
  xmlString: string
): Record<string, unknown> | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) return null;
    return _xmlToRecord(xmlDoc.documentElement);
  } catch (err) {
    return null;
  }
}

function _xmlToRecord(node: Element): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  // Add attributes
  if (node.attributes.length > 0) {
    for (const attr of Array.from(node.attributes)) {
      obj[`@_${attr.name}`] = attr.value;
    }
  }

  // Add children
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) {
      // Element
      const childObj = _xmlToRecord(child as Element);
      const name = (child as Element).nodeName;
      if (obj[name]) {
        // If already exists make it an array
        if (!Array.isArray(obj[name])) {
          obj[name] = [obj[name]];
        }
        (obj[name] as unknown[]).push(childObj);
      } else {
        obj[name] = childObj;
      }
    } else if (child.nodeType === 3) {
      // Text
      const text = child.nodeValue?.trim();
      if (text) obj["#text"] = text;
    }
  }

  return obj;
}
