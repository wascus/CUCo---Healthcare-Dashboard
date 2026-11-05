interface PlacedItem {
  happinessBonus?: number;
  [key: string]: unknown;
}

export const calculateHappiness = (placedItems: PlacedItem[] = []): number => {
  const itemBonus = placedItems.reduce((total, item) => total + (item.happinessBonus || 0), 0);
  return Math.min(100, Math.max(15, itemBonus));
};

export const getMoodText = (happiness: number): string => {
  if (happiness > 80) return "Energized!";
  if (happiness > 60) return "Happy";
  if (happiness > 40) return "Calm";
  if (happiness > 20) return "Resting";
  return "Peaceful";
};

export const getPetMessage = (happiness: number): string => {
  if (happiness > 80) {
    const messages = [
      "I'm absolutely thrilled!",
      "This is the best day ever!",
      "I feel amazing with all these items!",
      "So much joy around me!",
      "I could burst with happiness!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (happiness > 60) {
    const messages = [
      "I'm really happy right now!",
      "Things are looking great!",
      "I love my room!",
      "Feeling quite content today!",
      "This brings me joy!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (happiness > 40) {
    const messages = [
      "I'm doing okay, feeling calm.",
      "All is peaceful here.",
      "Just taking it easy today.",
      "Feeling a bit cozy.",
      "This moment is nice and quiet."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (happiness > 20) {
    const messages = [
      "I'm feeling a bit tired...",
      "I could use a pick-me-up.",
      "Getting a little drowsy.",
      "Would be nice to have something new...",
      "My energy is fading..."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  const messages = [
    "Please come visit me soon?",
    "I miss having things around...",
    "It's so empty here...",
    "I need some love and attention... I miss you"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};