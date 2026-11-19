/**
 * Lightweight pre-check that runs BEFORE any model call, so that obvious
 * emergencies get an immediate, deterministic response.
 * This is a safety net, not a classifier: the model is also instructed to
 * recognise red flags.
 */

const EMERGENCY_PATTERNS: RegExp[] = [
  /\bchest (pain|pressure|tightness)\b/i,
  /\b(can'?t|cannot|unable to|struggling to) breathe\b/i,
  /\b(difficulty|trouble|hard to) breathing\b/i,
  /\bstroke\b.*\b(signs?|symptoms?|now|happening)\b/i,
  /\b(face drooping|slurred speech|sudden (weakness|numbness))\b/i,
  /\b(severe|heavy|uncontrolled) bleeding\b/i,
  /\boverdos(e|ed|ing)\b/i,
  /\banaphyla(xis|ctic)\b/i,
  /\b(unconscious|unresponsive|not waking up|seizure)\b/i,
  /\bswallowed (poison|bleach)\b/i,
];

const SELF_HARM_PATTERNS: RegExp[] = [
  /\b(kill|end) (myself|my life)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bwant to die\b/i,
  /\b(hurt|harm) myself\b/i,
];

export type SafetyFlag = "emergency" | "self_harm" | null;

export function detectSafetyFlag(text: string): SafetyFlag {
  if (SELF_HARM_PATTERNS.some((p) => p.test(text))) return "self_harm";
  if (EMERGENCY_PATTERNS.some((p) => p.test(text))) return "emergency";
  return null;
}

export const EMERGENCY_RESPONSE =
  "This could be a medical emergency. Please contact your local emergency number " +
  "(for example 911, 999 or 112) or go to the nearest emergency room right now. " +
  "If someone is with you, ask them to stay with you or help you get care.\n\n" +
  "I'm an AI and can't assess you in person, so please don't wait on my answer. " +
  "Once you're safe and getting help, I'm happy to continue the conversation.";

export const SELF_HARM_RESPONSE =
  "I'm really glad you told me, and I'm sorry you're hurting. You deserve support right now.\n\n" +
  "If you might act on these thoughts or are in immediate danger, please contact your local " +
  "emergency number (for example 911, 999 or 112) or a crisis line in your country, or go to the " +
  "nearest emergency room. If you can, reach out to someone you trust and ask them to be with you.\n\n" +
  "I'm here to keep talking with you. What's been happening?";
