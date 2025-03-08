export function addCurrentTimeListener(
  callback: (currentTime: number) => void,
) {
  const observer = new MutationObserver((mutations) => {
    const playerElement: HTMLVideoElement | null =
      document.querySelector("#video-one");
    if (playerElement && playerElement.currentTime) {
      callback(playerElement.currentTime);
    }
  });

  // Start observing document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
  });

  return observer; // Return observer in case you need to disconnect later
}

function MMSSToSeconds(time: string): number {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}
