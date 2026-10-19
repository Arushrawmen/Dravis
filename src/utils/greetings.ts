/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Time-aware Greeting Engine for Dravis HUD & Startup Flow
 */

export interface TimeGreeting {
  title: string;
  subtitle: string;
  spokenGreeting: string;
  period: "morning" | "afternoon" | "evening" | "night";
}

/**
 * Returns a time-aware startup greeting based on the current hour.
 * Morning (05:00 - 11:59): "Good morning, [Name]. What are we going to accomplish today?"
 * Afternoon (12:00 - 16:59): "Good afternoon, [Name]. What are we working on today?"
 * Evening (17:00 - 20:59): "Good evening, [Name]. What would you like to accomplish?"
 * Night (21:00 - 04:59): "Good evening, [Name]. What can I help you with tonight?"
 */
export function getTimeAwareGreeting(userName?: string): TimeGreeting {
  const currentHour = new Date().getHours();
  const name = (userName && userName.trim()) || "Arush Sir";

  if (currentHour >= 5 && currentHour < 12) {
    return {
      title: `Good morning, ${name}`,
      subtitle: "What are we going to accomplish today?",
      spokenGreeting: `Good morning, ${name}. What are we going to accomplish today?`,
      period: "morning",
    };
  } else if (currentHour >= 12 && currentHour < 17) {
    return {
      title: `Good afternoon, ${name}`,
      subtitle: "What are we working on today?",
      spokenGreeting: `Good afternoon, ${name}. What are we working on today?`,
      period: "afternoon",
    };
  } else if (currentHour >= 17 && currentHour < 21) {
    return {
      title: `Good evening, ${name}`,
      subtitle: "What would you like to accomplish?",
      spokenGreeting: `Good evening, ${name}. What would you like to accomplish?`,
      period: "evening",
    };
  } else {
    // Night (21:00 to 04:59)
    return {
      title: `Good evening, ${name}`,
      subtitle: "What can I help you with tonight?",
      spokenGreeting: `Good evening, ${name}. What can I help you with tonight?`,
      period: "night",
    };
  }
}
