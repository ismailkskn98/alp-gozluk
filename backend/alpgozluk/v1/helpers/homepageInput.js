const localeSectionFields = {
  hero: {
    title: 190,
    description: 600,
    primaryAction: 100,
    secondaryAction: 100,
  },
  featured: {
    title: 190,
    description: 600,
    action: 100,
  },
  modelShowcase: {
    title: 190,
    description: 600,
    featured: 100,
    action: 100,
  },
  categories: {
    title: 190,
    description: 600,
    sunglasses: 160,
    sunglassesCopy: 320,
    darkFrames: 160,
    darkFramesCopy: 320,
    action: 100,
    darkFramesAction: 100,
  },
  frameStory: {
    title: 190,
    description: 600,
    action: 100,
    visualLabel: 255,
  },
};

const imageSlots = ['categoryPrimary', 'categorySecondary', 'frameStory'];

const normalizeText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
};

const normalizeTextList = (value, expectedLength) => {
  if (!Array.isArray(value) || value.length !== expectedLength) return null;
  const normalized = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const title = normalizeText(entry.title, 160);
    const description = normalizeText(entry.description, 500);
    if (!title || !description) return null;
    normalized.push({ title, description });
  }
  return normalized;
};

const normalizeLocaleContent = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const output = {};
  for (const [section, fields] of Object.entries(localeSectionFields)) {
    if (!input[section] || typeof input[section] !== 'object') return null;
    output[section] = {};
    for (const [field, maxLength] of Object.entries(fields)) {
      const value = normalizeText(input[section][field], maxLength);
      if (!value) return null;
      output[section][field] = value;
    }
  }
  output.frameStory.points = normalizeTextList(input.frameStory.points, 4);
  output.services = normalizeTextList(input.services, 3);
  if (!output.frameStory.points || !output.services) return null;
  return output;
};

const normalizeHomepagePayload = (body = {}) => {
  const tr = normalizeLocaleContent(body.tr);
  const en = normalizeLocaleContent(body.en);
  if (!tr || !en || !body.images || typeof body.images !== 'object') return null;

  const images = {};
  for (const slot of imageSlots) {
    const rawValue = body.images[slot];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      images[slot] = null;
      continue;
    }
    const id = Number(rawValue);
    if (!Number.isInteger(id) || id <= 0) return null;
    images[slot] = id;
  }

  return { tr, en, images };
};

module.exports = { imageSlots, normalizeHomepagePayload };
